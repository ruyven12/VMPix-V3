const endpoint = "https://vmpix-data.onrender.com/api/calendar";
function event(overrides = {}) {
  return { event_id: "gig-1", title: "Evening performance", date: "2027-06-10", start_time: "19:30", all_day: false,
    location: "Portland, Maine", status: "confirmed", description: "Doors open before the performance.", ...overrides };
}
function payload(events) {
  return { status: events.length ? "ready" : "empty", timezone: "America/New_York", events,
    freshness: { verified_at: "2027-06-01T12:00:00.000Z", expires_at: "2027-06-01T12:05:00.000Z", age_seconds: 0 } };
}
function readyPayload() {
  return payload([
    event(),
    event({ event_id: "gig-3", title: "Community gathering", date: "2027-06-12", all_day: true, start_time: null, description: null }),
    event({ event_id: "gig-2", title: "Morning performance", start_time: "09:05" }),
    event({ event_id: "gig-4", title: "All-day festival", all_day: true, start_time: null, location: null }),
    event({ event_id: "gig-5", title: "Afternoon performance", date: "2027-06-15", start_time: "12:00" }),
    event({ event_id: "gig-6", title: "Late performance", date: "2027-06-19", start_time: "00:00" }),
  ]);
}
function fulfillCalendar(route, body = readyPayload(), status = 200) {
  return route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
}
module.exports = { endpoint, event, payload, readyPayload, fulfillCalendar };
