import React, { useEffect, useRef, useState } from "react";
import { Calendar, View, Views, dateFnsLocalizer } from "react-big-calendar";
import {
  startOfMonth,
  lastDayOfMonth,
  startOfWeek,
  lastDayOfWeek,
  startOfDay,
  addHours,
  endOfDay,
  format as formatDate
} from "date-fns";
import format from "date-fns/format";
import parse from "date-fns/parse";
import getDay from "date-fns/getDay";
import enIN from "date-fns/locale/en-IN";
import { Button, Modal } from "antd";
import { CloseOutlined, EditOutlined, SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { CalendarEvent } from "./models/CalendarEvent";
import { useForm } from "react-hook-form";
import { User } from "./models/User";
import { NewEvent } from "./models/NewEvent";

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

  const formRef = useRef<HTMLFormElement>(null);

  const [saveInProgress, setSaveInProgress] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);

  const [startDate, setStartDate] = useState(startOfMonth(currentDate));
  const [endDate, setEndDate] = useState(lastDayOfMonth(currentDate));

  const getUsersByAttendeeList = () => {
    if (selectedEvent !== undefined) {
      let userList = [];
      for (let i = 0; i < selectedEvent.attendees.length; i++) {
        const attendee = selectedEvent.attendees[i];
        const user = users.find((user) => user.email == attendee.email);
        if (user !== undefined) {
          userList.push(`${user.id}`);
        }
      }
      console.log(userList);
      return userList;
    } else {
      return [];
    }
  }

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: "",
      location: "",
      description: "",
      start: formatDate(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end: formatDate(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      organizer_name: "",
      organizer_email: "",
      attendees: []
    },
    values: {
      title: selectedEvent === undefined ? "" : selectedEvent.title,
      location: selectedEvent === undefined ? "" : selectedEvent.location,
      description: selectedEvent === undefined ? "" : selectedEvent.description,
      start: formatDate(new Date(selectedEvent === undefined ? new Date() : selectedEvent.start), "yyyy-MM-dd'T'HH:mm"),
      end: formatDate(addHours(new Date(selectedEvent === undefined ? new Date() : selectedEvent.end), 1), "yyyy-MM-dd'T'HH:mm"),
      organizer_name: selectedEvent === undefined ? "" : selectedEvent.organizer.name,
      organizer_email: selectedEvent === undefined ? "" : selectedEvent.organizer.email,
      attendees: getUsersByAttendeeList()
    }
  });

  const url = `http://localhost:5000/api/calendar/events?`;
  const addEventUrl = `http://localhost:5000/api/calendar/events`;
  const usersUrl = `https://dummyjson.com/users?limit=20`;
  const exportUrl = `http://localhost:5000/api/calendar/events/export?`;
  const exportMultipleUrl = `http://localhost:5000/api/calendar/events/export/all?`;

  const handleFormSubmit = async (data: any) => {
    setSaveInProgress(true);
    console.log(data);
    if (selectedEvent !== undefined) {
      editEvent(data, selectedEvent._id);
    } else {
      addNewEvent(data);
    }
  }

  const editEvent = async (data: any, id: string) => {
    let eventToBeUpdated = {
      description: data.description,
      title: data.title,
      location: data.location,
      start: new Date(data.start).toISOString(),
      end: new Date(data.end).toISOString(),
      organizer: {
        name: data.organizer_name,
        email: data.organizer_email
      },
      attendees: getAttendeeFromUserList(data.attendees)
    };
    console.log(eventToBeUpdated);
    const req = await fetch(`${addEventUrl}/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(eventToBeUpdated)
    });
    const res = await req.json();
    console.log(res);
    if (res.acknowledged === true) {
      reset({
        title: "",
        location: "",
        description: "",
        start: formatDate(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end: formatDate(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        organizer_name: "",
        organizer_email: "",
        attendees: []
      });
      setIsModalOpen(false);
      setSaveInProgress(false);
      getEvents();
    }
  }

  const addNewEvent = async (data: any) => {
    let event: NewEvent = {
      title: data.title,
      start: new Date(data.start).toISOString(),
      end: new Date(data.end).toISOString(),
      location: data.location,
      description: data.description,
      organizer: {
        name: data.organizer_name,
        email: data.organizer_email
      },
      attendees: getAttendeeFromUserList(data.attendees)
    }
    console.log(event);
    const req = await fetch(addEventUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(event)
    });
    const res = await req.json();
    console.log(res);
    if (res.acknowledged === true) {
      reset({
        title: "",
        location: "",
        description: "",
        start: formatDate(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end: formatDate(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        organizer_name: "",
        organizer_email: "",
        attendees: []
      });
      setIsModalOpen(false)
      setSaveInProgress(false);
      getEvents();
    }
  }

  const getUsers = async () => {
    const res = await fetch(usersUrl);
    const body = await res.json();
    setUsers(body.users);
  }

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

  const exportMultipleEvents = async () => {
    const params = new URLSearchParams();
    params.append("start", startDate.toISOString());
    params.append("end", endDate.toISOString());
    const res = await fetch(exportMultipleUrl + params.toString());
    const blob = await res.blob();
    let file = window.URL.createObjectURL(blob);
    window.location.assign(file);
  };

  const getAttendeeFromUserList = (userIds: []) => {
    let attendeeList = [];
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const attendee = users.find((user) => user.id == userId);
      if (attendee !== undefined) {
        attendeeList.push({
          name: attendee.firstName + " " + attendee.lastName,
          email: attendee.email,
          rsvp: undefined,
          partstat: undefined,
          role: "REQ-PARTICIPANT"
        })
      }
    }
    return attendeeList;
  }

  useEffect(() => {
    getUsers();
  }, [])

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
    setSelectedEvent(event);
    setIsModalOpen(true);
    console.log(event);
  }

  const onExportClick = async () => {
    if (selectedEvent !== undefined) {
      const params = new URLSearchParams();
      params.append("id", selectedEvent._id);
      const res = await fetch(exportUrl + params.toString());
      const blob = await res.blob();
      let file = window.URL.createObjectURL(blob);
      window.location.assign(file);
    }
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(undefined);
  }

  const editFooter = [
    <Button type="primary" key="edit" icon={<EditOutlined />} onClick={handleSubmit(handleFormSubmit)}>Edit</Button>,
    <Button type="primary" key="export" icon={<UploadOutlined />} onClick={onExportClick}>Export</Button>,
    <Button type="primary" key="close" icon={<CloseOutlined />} onClick={closeModal} danger>Close</Button>
  ]

  const saveFooter = [
    <Button type="primary" key="add" icon={<SaveOutlined />} onClick={handleSubmit(handleFormSubmit)} loading={saveInProgress}>Save</Button>,
    <Button type="primary" key="close" icon={<CloseOutlined />} onClick={closeModal} danger disabled={saveInProgress}>Close</Button>
  ]

  return (
    <>
      <Modal centered title={selectedEvent === undefined ? "Add new event" : selectedEvent.title} open={isModalOpen} onCancel={closeModal} footer={selectedEvent === undefined ? saveFooter : editFooter}>
        <form ref={formRef}>
          <input type='text' {...register("title", { required: true })} placeholder='Title' />
          <input type='text' {...register("location", { required: true })} placeholder='Location' />
          <input type='text' {...register("description", { required: true })} placeholder='Agenda' />
          <input type='datetime-local' {...register("start", { required: true })} placeholder='Start Time' />
          <input type='datetime-local' {...register("end", { required: true })} placeholder='End Time' />
          <input type='text' {...register("organizer_name", { required: true })} placeholder='Organizer name' />
          <input type='email' {...register("organizer_email", { required: true })} placeholder='Organizer email' />
          <select multiple style={{ width: "100%" }} {...register("attendees", { required: true })} >
            {users.map((user) => {
              return (
                <option value={user.id}>{`${user.firstName} ${user.lastName} (${user.email})`}</option>
              );
            })}
          </select>
        </form>
      </Modal>
      <Button type="primary" style={{ margin: "10px" }} onClick={() => setIsModalOpen(true)}>Add new event</Button>
      <Button type="primary" style={{ margin: "10px" }} onClick={() => exportMultipleEvents()}>Export all</Button>
      <Calendar
        localizer={localizer}
        startAccessor="start"
        endAccessor="end"
        events={events}
        style={{ height: "100%" }}
        onNavigate={onNavigate}
        onView={onViewChange}
        onSelectEvent={onEventClick}
        view={view}
      />
    </>
  );
};

export default CalendarComponent;
