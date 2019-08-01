import { APITag } from './Item';

import { User } from './User';
import { Ocean } from './Ocean';
import { License } from './License';

export enum collectionTypes {
  Series = 'Series',
  Area_of_Research = 'Area of research',
  Event = 'Event',
  Event_Series = 'Event Series',
  Edited_Volume = 'Edited Volume',
  Expedition = 'Expedition',
  Collection = 'Collection',
  Convening = 'Convening',
  Performance = 'Performance',
  Installation = 'Installation',
  Other = 'Other'
}

export interface Collection {
  count?: number;
  id?: string;

  created_at?: string | null;
  updated_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  time_produced?: string | null;
  year_produced?: string | null;

  status?: boolean | null;

  concept_tags?: number[] | null;
  keyword_tags?: number[] | null;
  aggregated_concept_tags?: APITag[] | null;
  aggregated_keyword_tags?: APITag[] | null;

  place?: string | null;

  regional_focus?: string | null;
  country_or_ocean?: Ocean | string | null;

  creators?: string[] | null;
  contributors?: User[] | string | null;

  directors?: string[] | null;
  writers?: string | null;

  editor?: string | null;
  collaborators?: string[] | null;

  exhibited_at?: string | null;
  series?: number | null;

  isbn?: string[] | null;
  edition?: string | null;

  publisher?: string | null;
  interviewers?: string[] | null;

  interviewees?: string[] | null;
  cast_?: string[] | null;

  title?: string | null;
  subtitle?: string | null;

  description?: string | null;

  copyright_holder?: string | null;
  copyright_country?: string | null;

  disciplinary_field?: string | null;

  specialization?: string | null;
  department?: string | null;
  institution?: string | null;

  expedition_vessel?: string | null;
  expedition_route?: string | null;
  expedition_blog_link?: string | null;
  expedition_leader?: string | null;
  expedition_start_point?: string | null;
  expedition_end_point?: string | null;

  participants?: string[] | null;

  venues?: string[] | null;
  curator?: string | null;

  host?: string[] | null;
  hosted_by?: string[] | null;
  type?: collectionTypes;
  event_type?: string;

  installation_name?: string[] | null;

  host_organisation?: string[] | null;
  focus_arts?: number | null;

  focus_action?: number | null;
  focus_scitech?: number | null;

  city_of_publication?: string | null;
  media_type?: string | null;

  url?: string | null;
  related_material?: string[] | null;

  license?: License;
  location?: string | null;

  other_metadata?: string | null;
  geojson?: string | null;

  map_icon?: string | null;

  series_name?: string | null;
  volume_in_series?: number | null;
  pages?: number | null;
  journal?: string | null;

  items?: string[]; // a list of item s3_keys

  digital_collection?: boolean;
}