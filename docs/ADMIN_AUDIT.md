# Admin Audit API

Admin audit endpoint with cursor pagination and filters. Requires authenticated admin user.

## Endpoint

`GET /api/admin/audit`

### Auth

- Requires valid `Authorization: Bearer <token>`.
- 401 if missing/invalid token.
- 403 if authenticated user is not `role=admin`.

### Query params

- `limit` (default 50, max 200)
- `cursor` (format: `ts:id`, opaque to clients)
- `action`
- `actorUserId`
- `entityType`
- `entityId`
- `from` (ISO timestamp, inclusive)
- `to` (ISO timestamp, inclusive)
- `q` (text search in action/entity/actor/payload)

### Response

```json
{
  "items": [
    {
      "id": 12,
      "ts": "2024-04-10T12:34:56.789Z",
      "actorUserId": "123",
      "actorRole": "admin",
      "action": "gig_published",
      "entityType": "gig",
      "entityId": "3",
      "payloadJson": "{\"fromStatus\":\"draft\",\"toStatus\":\"published\"}",
      "ip": "127.0.0.1",
      "userAgent": "Mozilla/5.0"
    }
  ],
  "nextCursor": "2024-04-10T12:34:56.789Z:12"
}
```

`nextCursor` is `null` when there are no more items.

## Examples

Fetch first page:

```
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/audit?limit=50"
```

Fetch next page:

```
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/audit?limit=50&cursor=2024-04-10T12:34:56.789Z:12"
```

Filter by action and date range:

```
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/audit?action=gig_published&from=2024-01-01T00:00:00.000Z&to=2024-12-31T23:59:59.999Z"
```

Text search:

```
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/audit?q=worker@example.com"
```
