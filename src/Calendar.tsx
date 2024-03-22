import React, { useEffect, useState } from "react";
import { Calendar, View, Views, dateFnsLocalizer } from "react-big-calendar";
import {
  startOfMonth,
  lastDayOfMonth,
  startOfWeek,
  lastDayOfWeek,
  startOfDay,
  endOfDay,
} from "date-fns";
import format from "date-fns/format";
import parse from "date-fns/parse";
import getDay from "date-fns/getDay";
import enIN from "date-fns/locale/en-IN";

interface Organizer {
  name: string,
  email: string,
}

interface Attendee {
  name: string,
  email: string,
  rsvp: boolean | undefined,
  partstat: string | undefined,
  role: string
}

interface CalendarEvent {
  _id: string,
  title: string,
  start: Date,
  end: Date,
  allDay?: boolean | undefined,
  resource?: any | undefined,
  location: string,
  agenda: string,
  organizer: Organizer,
  attendees: Attendee[]
}

const CalendarComponent = () => {
  const locales = {
    "en-IN": enIN,
  };

  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);

  const [startDate, setStartDate] = useState(startOfMonth(currentDate));
  const [endDate, setEndDate] = useState(lastDayOfMonth(currentDate));

  const url = `http://localhost:5000/api/calendar/events?`;
  const exportUrl = `http://localhost:5000/api/calendar/events/export?`;

  const getEvents = async () => {
    const params = new URLSearchParams();
    params.append("start", startDate.toISOString());
    params.append("end", endDate.toISOString());
    const res = await fetch(url + params.toString());
    const events: CalendarEvent[] = await res.json();
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      event.start = new Date(event.start);
      event.end = new Date(event.end);
    }
    console.log(events);
    setEvents(events);
  };

  useEffect(() => {
    getEvents();
  }, [currentDate, startDate, endDate]);

  const onNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
    setStartDate(startOfMonth(newDate));
    setEndDate(lastDayOfMonth(newDate));
  };

  useEffect(() => {
    if (view === Views.MONTH || view === Views.AGENDA) {
      setStartDate(startOfMonth(currentDate));
      setEndDate(lastDayOfMonth(currentDate));
    } else if (view === Views.WEEK) {
      setStartDate(startOfWeek(currentDate));
      setEndDate(lastDayOfWeek(currentDate));
    } else if (view === Views.DAY) {
      setStartDate(startOfDay(currentDate));
      setEndDate(endOfDay(currentDate));
    }
  }, [view]);

  const onViewChange = (newView: View) => {
    setView(newView);
  };

  const onEventClick = async (event: CalendarEvent) => {
    console.log(event);
    const params = new URLSearchParams();
    params.append("id", event._id);
    const res = await fetch(exportUrl + params.toString());
    const blob = await res.blob();
    let file = window.URL.createObjectURL(blob);
    window.location.assign(file);
  }

  return (
    <Calendar
      localizer={localizer}
      startAccessor="start"
      endAccessor="end"
      events={events}
      style={{ height: "100vh" }}
      onNavigate={onNavigate}
      onView={onViewChange}
      onSelectEvent={onEventClick}
      view={view}
    />
  );
};

export default CalendarComponent;
