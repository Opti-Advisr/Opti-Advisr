import json
import os
from datetime import datetime

import boto3


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}


def _load_payload(event):
    body = event.get("body") if isinstance(event, dict) else None
    if isinstance(body, str):
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {}
    if isinstance(body, dict):
        return body
    return {}


def _respond(status_code, payload):
    return {
        "statusCode": status_code,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(payload),
    }


def _error(status_code, message):
    return _respond(status_code, {"status": "error", "message": message})


def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    payload = _load_payload(event or {})

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Contract inputs: start, end (YYYY-MM-DD), granularity (DAILY|MONTHLY),
    # group_by (SERVICE). Defaults: month to date, MONTHLY, grouped by SERVICE.
    start = payload.get("start") or month_start.strftime("%Y-%m-%d")
    end = payload.get("end") or now.strftime("%Y-%m-%d")
    granularity = str(payload.get("granularity") or "MONTHLY").upper()
    if granularity not in ("DAILY", "MONTHLY"):
        return _error(400, "granularity must be DAILY or MONTHLY")
    group_by = payload.get("group_by")

    try:
        datetime.strptime(start, "%Y-%m-%d")
        datetime.strptime(end, "%Y-%m-%d")
    except ValueError:
        return _error(400, "start and end must be dates in YYYY-MM-DD format")

    request = {
        "TimePeriod": {"Start": start, "End": end},
        "Granularity": granularity,
        "Metrics": ["BlendedCost"],
    }
    if group_by:
        if str(group_by).upper() != "SERVICE":
            return _error(400, "only group_by SERVICE is supported")
        request["GroupBy"] = [{"Type": "DIMENSION", "Key": "SERVICE"}]

    try:
        client = boto3.client("ce", region_name=os.environ.get("AWS_COST_EXPLORER_REGION", "us-east-1"))
        response = client.get_cost_and_usage(**request)
    except Exception:
        # No silent demo fallback: surface the failure so callers can react.
        return _error(502, "Cost Explorer is unavailable right now. Please try again shortly.")

    results = []
    services_by_name = {}
    total_amount = 0.0

    for period_block in response.get("ResultsByTime", []):
        period_start = period_block.get("TimePeriod", {}).get("Start", start)
        groups = period_block.get("Groups", [])
        if groups:
            for group in groups:
                service = group.get("Keys", ["unknown"])[0]
                amount = float(group.get("Metrics", {}).get("BlendedCost", {}).get("Amount", "0"))
                results.append({"period": period_start, "service": service, "amount": amount})
                services_by_name[service] = services_by_name.get(service, 0.0) + amount
                total_amount += amount
        else:
            amount = float(period_block.get("Total", {}).get("BlendedCost", {}).get("Amount", "0"))
            results.append({"period": period_start, "service": None, "amount": amount})
            total_amount += amount

    services = [
        {"service": name, "amount": str(round(amount, 4))}
        for name, amount in sorted(services_by_name.items(), key=lambda kv: kv[1], reverse=True)
    ]

    return _respond(200, {
        "status": "ok",
        "currency": "USD",
        "results": results,
        # Fields the current dashboard reads:
        "period": payload.get("period", "monthly"),
        "metric": payload.get("metric", "cost"),
        "message": "Cost data retrieved",
        "window": {"start": start, "end": end},
        "amount": round(total_amount, 4),
        "services": services,
    })
