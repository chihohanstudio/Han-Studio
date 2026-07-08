export const STUDIO_TIME_ZONE = "America/Indiana/Indianapolis";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric"
});

export function formatDateTime(value: string | Date) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string | Date) {
  return dateFormatter.format(new Date(value));
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function toDateTimeLocalInput(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date(value));

  const get = (type: Intl.DateTimeFormatPartTypes) => {
    const match = parts.find((part) => part.type === type)?.value;
    if (!match) {
      throw new Error(`Could not resolve ${type}.`);
    }
    return match;
  };

  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

export function zonedDateTimeToUtcIso(localDateTime: string) {
  const [datePart, timePart] = localDateTime.split("T");
  if (!datePart || !timePart) {
    throw new Error("Invalid date/time.");
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return zonedPartsToUtcIso(year, month, day, hour, minute);
}

export function zonedDateAndTimeToUtcIso(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return zonedPartsToUtcIso(year, month, day, hour, minute);
}

function zonedPartsToUtcIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const zoneParts = getZoneParts(new Date(utcGuess));
  const zoneAsUtc = Date.UTC(
    zoneParts.year,
    zoneParts.month - 1,
    zoneParts.day,
    zoneParts.hour,
    zoneParts.minute
  );
  const offset = zoneAsUtc - utcGuess;
  return new Date(utcGuess - offset).toISOString();
}

function getZoneParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) => {
    const match = parts.find((part) => part.type === type)?.value;
    if (!match) {
      throw new Error(`Could not resolve ${type}.`);
    }
    return Number(match);
  };

  const hour = value("hour");
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: hour === 24 ? 0 : hour,
    minute: value("minute")
  };
}
