import { Attendee } from "./Attendee";
import { Organizer } from "./Organizer";

export interface CalendarEvent {
    _id: string,
    title: string,
    start: Date,
    end: Date,
    allDay?: boolean | undefined,
    resource?: any | undefined,
    location: string,
    description: string,
    organizer: Organizer,
    attendees: Attendee[]
}
