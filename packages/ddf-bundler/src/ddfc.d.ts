export interface DDFC {
    schema:            string;
    "doc:path":        string;
    "doc:hdr":         string;
    manufacturername:  string | string[];
    modelid:           string | string[];
    vendor:            string;
    product:           string;
    status:            string;
    sleeper:           boolean;
    "md:known_issues": string | string[];
    subdevices:        Subdevice[];
}

export interface Subdevice {
    type:        string;
    restapi:     string;
    uuid:        string[];
    fingerprint: Fingerprint;
    items:       Item[];
    example:     Example;
}

export interface Example {
    config:           Config;
    lastseen:         string;
    manufacturername: string;
    modelid:          string;
    name:             string;
    state:            State;
    swversion:        string;
    type:             string;
    uniqueid:         string;
}

export interface Config {
    battery:        number;
    on:             boolean;
    pending:        any[];
    reachable:      boolean;
    sensitivity:    number;
    sensitivitymax: number;
    temperature:    number;
}

export interface State {
    lastupdated:       Date;
    orientation:       number[];
    tiltangle:         number;
    vibration:         boolean;
    vibrationstrength: number;
}

export interface Fingerprint {
    profile:  string;
    device:   string;
    endpoint: string;
    in:       string[];
}

export interface Item {
    name:                string;
    read?:               Read;
    parse?:              Parse;
    awake?:              boolean;
    write?:              Write;
    values?:             Array<Array<number | string>>;
    default?:            boolean | number;
    "refresh.interval"?: number;
    comment?:            string;
}

export interface Parse {
    cl?:     string;
    at:      string;
    eval?:   string;
    fn?:     string;
    idx?:    string;
    script?: string;
}

export interface Read {
    cl:  string;
    at:  string;
    mf?: string;
}

export interface Write {
    cl:   string;
    at:   string;
    dt:   string;
    mf:   string;
    eval: string;
}