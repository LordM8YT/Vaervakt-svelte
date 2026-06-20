import { MONTHS, DAYS } from './DateConstants';

const OSLO_TIME_ZONE = 'Europe/Oslo';

export function getWeekDays() {
  const dayInAWeek = new Date().getDay();
  const days = DAYS.slice(dayInAWeek, DAYS.length).concat(
    DAYS.slice(0, dayInAWeek)
  );
  return days;
}

export function getDayMonthFromDate(date = new Date()) {
  const month = MONTHS[date.getMonth()].slice(0, 3);
  const day = date.getDate();

  return day + ' ' + month;
}

export function transformDateFormat() {
  const month = new Date().toLocaleString('en-US', { month: '2-digit' });
  const day = new Date().toLocaleString('en-US', { day: '2-digit' });
  const year = new Date().getFullYear();
  const time = new Date().toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  return year.toString().concat('-', month, '-', day, ' ', time);
}

export function getLocalDatetime() {
  const now = new Date();
  const date = now.toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: 'short',
    timeZone: OSLO_TIME_ZONE,
  });
  const time = now.toLocaleTimeString('nb-NO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: OSLO_TIME_ZONE,
  });

  return `${date} kl. ${time}`;
}

export function getUTCDatetime() {
  return getLocalDatetime();
}

export function getUTCTime() {
  return new Date().toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  });
}

export function formatForecastHour(timestampInSeconds) {
  return new Date(timestampInSeconds * 1000).toLocaleTimeString('nb-NO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: OSLO_TIME_ZONE,
  });
}
