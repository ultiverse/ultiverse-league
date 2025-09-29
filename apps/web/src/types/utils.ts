export interface Team {
    id: string;
    name: string;
    colour?: string;
}

export interface ICSEvent {
    uid: string;
    title: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
    allDay?: boolean;
}