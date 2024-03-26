import { Attendee } from "./Attendee";
import { Organizer } from "./Organizer";

export interface NewEvent {
    title: string,
    start: string,
    end: string,
    location: string,
    description: string,
    organizer: Organizer,
    attendees: Attendee[]
}
