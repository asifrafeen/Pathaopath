// Data Gateway access for PathaoPoth.
//
// Conventions the gateway actually uses (all confirmed against the live tenant —
// guessing these costs a lot of 400s):
//   - list queries are get<SchemaName>s, e.g. getExceptionCases — NOT <Schema>s
//   - args are (input, where, order, paging); input is {filter, sort, pageNo, pageSize}
//   - filter is a JSON STRING holding a Mongo-style query, not a GraphQL object
//   - the result type is <Schema>Result { items, totalCount, pageNo, pageSize,
//     totalPages, hasNextPage, hasPreviousPage }
//   - platform fields are PascalCase (ItemId, CreatedDate); authored fields keep
//     the casing they were authored with (camelCase here)
//   - mutations are insert/update/delete<SchemaName>
//
// Row and column filtering happens server-side from the caller's token. Nothing here
// re-implements access control, and nothing here should: a query that returns fewer
// rows for one role than another is the gateway working, not a bug.
import { blocksClient } from "../blocks/client";

type GqlResult<T> = { data?: T; errors?: Array<{ message?: string }> };

async function gql<T>(query: string): Promise<T> {
  const res = (await blocksClient.data.graphql({ query })) as GqlResult<T>;
  if (res?.errors?.length) throw new Error(res.errors[0]?.message ?? "Data Gateway error");
  if (!res?.data) throw new Error("Data Gateway returned no data");
  return res.data;
}

/** Mongo-style filter, embedded as a JSON string inside the GraphQL document. */
function filterArg(filter: Record<string, unknown>): string {
  return JSON.stringify(JSON.stringify(filter));
}

/** GraphQL object literal — keys unquoted, values JSON. */
function objectLiteral(input: Record<string, unknown>): string {
  const body = Object.entries(input)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${valueLiteral(v)}`)
    .join(", ");
  return `{${body}}`;
}

function valueLiteral(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return `[${v.map(valueLiteral).join(", ")}]`;
  if (typeof v === "object") return objectLiteral(v as Record<string, unknown>);
  return JSON.stringify(v);
}

type Page<T> = { items: T[]; totalCount: number };

async function list<T>(schema: string, fields: string, opts: {
  filter?: Record<string, unknown>; sort?: string; pageNo?: number; pageSize?: number;
} = {}): Promise<Page<T>> {
  const input = objectLiteral({
    filter: opts.filter ? JSON.stringify(opts.filter) : undefined,
    sort: opts.sort,
    pageNo: opts.pageNo ?? 1,
    pageSize: opts.pageSize ?? 50
  });
  const key = `get${schema}s`;
  const data = await gql<Record<string, Page<T>>>(`{ ${key}(input: ${input}) { totalCount items { ${fields} } } }`);
  return data[key] ?? { items: [], totalCount: 0 };
}

async function insert(schema: string, input: Record<string, unknown>): Promise<string | undefined> {
  const key = `insert${schema}`;
  const data = await gql<Record<string, { itemId?: string }>>(
    `mutation { ${key}(input: ${objectLiteral(input)}) { itemId acknowledged } }`
  );
  return data[key]?.itemId;
}

async function update(schema: string, itemId: string, input: Record<string, unknown>): Promise<void> {
  const key = `update${schema}`;
  await gql(`mutation { ${key}(filter: ${filterArg({ _id: itemId })}, input: ${objectLiteral(input)}) { acknowledged totalImpactedData } }`);
}

/* ------------------------------------------------------------------- types */

export type Hub = {
  ItemId: string; code: string; name: string; address?: string;
  organizationId?: string; isActive?: boolean;
};

export type Parcel = {
  ItemId: string; trackingNumber: string; senderId?: string;
  receiverName?: string; receiverPhone?: string | null;
  currentDeliveryAddress?: string; originalDeliveryAddress?: string;
  codAmount?: number; currency?: string;
  originHub?: { code?: string; name?: string } | null;
  destinationHub?: { code?: string; name?: string } | null;
};

export type ExceptionCase = {
  ItemId: string; parcelId: string; caseType: string; status: string;
  ownerHubId?: string; ownerHubOrgId?: string;
  ownerHub?: { code?: string; name?: string } | null;
  accountableStaff?: { name?: string } | null;
  custodyType?: string; custodyHolder?: { name?: string; code?: string } | null;
  originHubCode?: string; destinationHubCode?: string; routeKey?: string;
  attemptCount?: number; receiptCount?: number;
  openedAt?: string; slaDueAt?: string; slaBreached?: boolean;
  closedAt?: string | null; resolution?: string | null;
  parcel?: { trackingNumber?: string; codAmount?: number; currency?: string; receiverName?: string; currentDeliveryAddress?: string } | null;
};

export type HubReceipt = {
  ItemId: string; caseId: string; parcelId: string; trackingNumber?: string;
  hubCode?: string; receivedAt?: string; reportedReason?: string;
  parcelCondition?: string; appliedState?: string;
  receivedByStaff?: { name?: string } | null;
};

export type CaseNote = {
  ItemId: string; caseId: string; rawText: string; occurredAt?: string; CreatedDate?: string;
};

/* ----------------------------------------------------------------- queries */

const HUB_FIELDS = "ItemId code name address organizationId isActive";
const PARCEL_FIELDS =
  "ItemId trackingNumber senderId receiverName receiverPhone currentDeliveryAddress originalDeliveryAddress codAmount currency originHub { code name } destinationHub { code name }";
const CASE_FIELDS =
  "ItemId parcelId caseType status ownerHubId ownerHubOrgId ownerHub { code name } accountableStaff { name } custodyType custodyHolder { name code } originHubCode destinationHubCode routeKey attemptCount receiptCount openedAt slaDueAt slaBreached closedAt resolution parcel { trackingNumber codAmount currency receiverName currentDeliveryAddress }";
const RECEIPT_FIELDS =
  "ItemId caseId parcelId trackingNumber hubCode receivedAt reportedReason parcelCondition appliedState receivedByStaff { name }";
const NOTE_FIELDS = "ItemId caseId rawText occurredAt CreatedDate";

export const data = {
  hubs: () => list<Hub>("Hub", HUB_FIELDS, { pageSize: 200 }),

  parcelByTracking: async (trackingNumber: string): Promise<Parcel | null> => {
    const page = await list<Parcel>("Parcel", PARCEL_FIELDS, { filter: { trackingNumber }, pageSize: 1 });
    return page.items[0] ?? null;
  },

  /**
   * An open case is reused rather than duplicated. This is the integrity rule the
   * Data Gateway cannot enforce — it has no partial unique index — so the write path
   * is the only thing holding it, which is exactly why lookup happens before intake.
   */
  openCaseForParcel: async (parcelId: string): Promise<ExceptionCase | null> => {
    const page = await list<ExceptionCase>("ExceptionCase", CASE_FIELDS, {
      filter: { parcelId, status: { $ne: "closed" } },
      pageSize: 1
    });
    return page.items[0] ?? null;
  },

  cases: (opts: { status?: string; pageSize?: number } = {}) =>
    list<ExceptionCase>("ExceptionCase", CASE_FIELDS, {
      filter: opts.status ? { status: opts.status } : undefined,
      sort: JSON.stringify({ openedAt: -1 }),
      pageSize: opts.pageSize ?? 100
    }),

  caseById: async (itemId: string): Promise<ExceptionCase | null> => {
    const page = await list<ExceptionCase>("ExceptionCase", CASE_FIELDS, { filter: { _id: itemId }, pageSize: 1 });
    return page.items[0] ?? null;
  },

  receiptsForCase: (caseId: string) =>
    list<HubReceipt>("HubReceipt", RECEIPT_FIELDS, { filter: { caseId }, pageSize: 50 }),

  notesForCase: (caseId: string) =>
    list<CaseNote>("CaseNote", NOTE_FIELDS, { filter: { caseId }, pageSize: 50 }),

  insert,
  update
};
