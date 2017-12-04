import MediaSize from "./mediaEntity";

/* tslint:disable:variable-name */
export default class MediaEntity {
    public id: number;
    public id_str: string;
    public indices: number[];
    public media_url: string;
    public media_url_https: string;
    public url: string;
    public display_url: string;
    public expanded_url: string;
    public type: string;
    public sizes: {
        medium: MediaSize;
        small: MediaSize;
        thumb: MediaSize;
        large: MediaSize;
    };
}
/* tslint:enable:variable-name */
