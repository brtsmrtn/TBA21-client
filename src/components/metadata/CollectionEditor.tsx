import * as React from 'react';
import {
  Button,
  Col, CustomInput,
  DropdownItem, DropdownMenu, DropdownToggle,
  FormFeedback,
  FormGroup, FormText,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Label, Nav, NavItem, NavLink,
  Row, TabContent, TabPane, UncontrolledButtonDropdown
} from 'reactstrap';
import { API } from 'aws-amplify';
import Select from 'react-select';
import { isEqual, isArray } from 'lodash';

import Tags from './Tags';
import {
  collectionTypes,
  countries,
  licenseType,
  oceans
} from './SelectOptions';
import { Collection, collectionTypes as Types } from '../../types/Collection';
import { Item } from '../../types/Item';
import { Alerts, ErrorMessage, SuccessMessage, WarningMessage } from '../utils/alerts';

import pencil from '../../images/svgs/pencil.svg';
import YearSelect from './fields/YearSelect';
import { validateURL } from '../utils/inputs/url';
import { Items } from './Items';
import CustomSelect from './fields/CustomSelect';

interface Props {
  collection?: Collection;
  editMode: boolean;
}

interface State extends Alerts {
  originalCollection: Collection;
  collection: Collection;
  changedFields: {
    [key: string]: string
  };

  validate: {
    [key: string]: boolean
  };

  activeTab: string;
  // If we're editing the collection, we'll do an API call to get the items and push them to <Items />
  isDifferent: boolean;
  loadedItems: Item[];
  loadingItems: boolean;
  titleEnabled: boolean;
}

const defaultRequiredFields = (collection: Collection) => {
  const {
    title,
    description,
    focus_arts,
    focus_action,
    focus_scitech,
    aggregated_concept_tags,
    type,
  } = collection;

  return {
    'title': (!!title && !!title.length),
    'description': (!!description && !!description.length),
    'focus_arts': (!!focus_arts && !!focus_arts.toString().length),
    'focus_action': (!!focus_action && !!focus_action.toString().length),
    'focus_scitech': (!!focus_scitech && !!focus_scitech.toString().length),
    'concept_tags': (!!aggregated_concept_tags && !!aggregated_concept_tags.length),
    'type': (!!type && !!type.length)
  };
};

export class CollectionEditor extends React.Component<Props, State> {
  _isMounted;
  constructor(props: Props) {
    super(props);

    this._isMounted = false;

    const collection = props.collection || {};

    this.state = {
      originalCollection: collection,
      collection: {...collection},
      changedFields: {},

      loadedItems: [],
      loadingItems: !!props.collection,

      isDifferent: false,
      validate: defaultRequiredFields(collection),
      activeTab: '1',
      titleEnabled: false
    };
  }

  async componentDidMount(): Promise<void> {
    this._isMounted = true;

    if (this.props.collection) {
      const getItemsInCollection = async (id) => {
        const results = await API.get('tba21', 'admin/collections/getItemsInCollection', {
          queryStringParameters: {
            id: id
          }
        });

        if (results && results.items) {
          this.setState(
            {
              collection: {...this.state.collection, items: results.items.map( i => i.s3_key)},
              originalCollection: {...this.state.collection, items: results.items.map( i => i.s3_key)},
              loadedItems: results.items,
              loadingItems: false
            }
          );
        }
      };

      // don't wait for these.
      getItemsInCollection(this.props.collection.id);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  putCollection = async () =>  {
    this.setState(
      {
        errorMessage: undefined,
        successMessage: undefined,
        warningMessage: undefined
      }
    );

    const state = {};

    const invalidFields = Object.entries(this.state.validate).filter(v => v[1] === false).map(([key, val]) => key);
    if (invalidFields.length > 0) {
      Object.assign(state, { errorMessage: `Missing required Field(s)` });
      this.setState(state);
      return;
    }

    try {
      const collectionProperties = {};

      // if we're in edit more add the id to props
      if (this.props.editMode) {
        Object.assign(collectionProperties, { id: this.state.originalCollection.id });
      }

      // Put the items into the props
      if (this.state.collection.items) {
        Object.assign(collectionProperties, { items: this.state.collection.items });
      }

      // We filter out specific values here as the API doesn't accept them, but returns them in the Item object.
      Object.entries(this.state.changedFields)
        .filter( ([key, value]) => {
          return !(
            value === null
            // || key === 'id' // use this to exclude things, you shouldn't need to (eg don't put them in changedFields...
          );
        })
        .forEach( tag => {
          Object.assign(collectionProperties, { [tag[0]]: tag[1] });
        });

      const result = await API.put('tba21', `admin/collections/${this.props.editMode ? 'update' : 'create'}`, {
        body: {
          ...collectionProperties
        }
      });

      if (!result.success && result.message && result.message.length > 1) {
        // If we've failed set collection back to the original
        Object.assign(state, { errorMessage: result.message, collection: {...this.state.originalCollection}, changedFields: {}, status: false, isDifferent: false });
      } else if (result.success) {
        Object.assign(state, { successMessage: 'Updated collection!', changedFields: {}, originalCollection: {...this.state.collection}, isDifferent: false });
      } else {
        Object.assign(state, { warningMessage: result });
      }

    } catch (e) {
      console.log('ERROR - ', e);
      Object.assign(state, { errorMessage: 'We had an issue updating this collection.' });
    } finally {
      this.setState(state);
    }
  }

  itemsCallback = (s3key: string, removeItem?: boolean): void => {
    const
      s3keyIndex = !!this.state.collection.items ? this.state.collection.items.indexOf(s3key) : -1,
      itemsList = this.state.collection.items || [];

    if (itemsList.indexOf(s3key) === -1) {
      const items: string[] = [...itemsList, s3key];
      this.setState({ collection: {...this.state.collection, items: items}, isDifferent: true });
    } else if (!!removeItem) {
      // Remove the item if it exists and removeItem is true
      itemsList.splice(s3keyIndex, 1);

      // Remove the loaded item if it exists
      const loadedItems = this.state.loadedItems;
      if (loadedItems[s3key]) {
        delete loadedItems[s3key];
      }
      this.setState({ collection: {...this.state.collection, items: itemsList}, loadedItems: loadedItems, isDifferent: true });
    }
  }

  /**
   *
   * Adds changed values to collection and changedFields
   * Compares props.item to collection and enables/disabled Update button
   *
   * @param key { string }
   * @param value { any }
   */
  changeCollection = (key: string, value: any) => { // tslint:disable-line: no-any
    const { collection, changedFields } = this.state;

    if (value) {
      Object.assign(changedFields, { [key]: value });
      Object.assign(collection, { [key]: value });
    } else {
      if (changedFields[key]) {
        delete changedFields[key];
        // Reset back to original item key value
        Object.assign(collection, { [key]: this.state.originalCollection[key] });
      }
    }
    this.setState(
      {
        changedFields: changedFields,
        collection: collection,
        isDifferent: !isEqual(this.state.originalCollection, collection)
      }
    );
  }

  typeOnChange = (subType: string) => {
    const state = {
      ...defaultRequiredFields(this.state.collection),
      ...this.state.validate,
      type: true
    };

    const {
      institution,
      venues,
      start_date,
      editor,
      year_produced,
      end_date,
      expedition_leader,
      expedition_route,
      city_of_publication,
      media_type
    } = this.state.collection;

    const
      TypeFields = {
        'Event' : {
          'institution': (institution || false),
          'start_date': (start_date || false)
        },
        'Event Series' : {
          'venues': (venues || false),
          'start_date': (start_date || false)
        },
        'Edited Volume' : {
          'editor': (editor || false),
          'venues': (venues || false),
          'year_produced': (year_produced || false),
          'city_of_publication': (city_of_publication || false)
        },
        'Expedition' : {
          'start_date': (start_date || false),
          'end_date': (end_date || false),
          'expedition_leader': (expedition_leader || false),
          'institution': (institution || false),
          'expedition_route': (expedition_route || false)
        },
        'Exhibition' : {
          'institution': (institution || false),
          'start_date': (start_date || false)
        },
        'Collection' : {
          'institution': (institution || false),
          'media_type': (media_type || false)
        },
        'Convening' : {
          'venues': (venues || false),
          'start_date': (start_date || false)
        },
        'Performance' : {
          'venues': (venues || false)
        },
        'Installation' : {
          'start_date': (start_date || false)
        },
        'Series' : {
          'start_date': (start_date || false)
        }
      };

    if (TypeFields[subType]) {
      Object.assign(state, TypeFields[subType]);
      this.setState({ validate: state });
    }
  }

  validateLength = (field: string, inputValue: string | string[]): void => {
    let valid = false;
    this.changeCollection(field, inputValue);
    if (inputValue && inputValue.length > 0) {
      valid = true;
    }
    this.setState({ validate: { ...this.state.validate, [field]: valid } }, () => {
      if (!isArray(inputValue) && field === 'type') {
        this.typeOnChange(inputValue);
      }
    });
  }

  Series = (): JSX.Element => {
    const collection = this.state.collection;
    return (
      <Row>
        <Col md="6">
          <FormGroup>
            <Label for="start_date">Start Date</Label>
            <Input
              type="date"
              id="start_date"
              defaultValue={collection.start_date ? collection.start_date : ''}
              invalid={this.state.validate.hasOwnProperty('start_date') && !this.state.validate.start_date}
              onChange={e => this.validateLength('start_date', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="end_date">End Date</Label>
            <Input
              type="date"
              id="end_date"
              defaultValue={collection.end_date ? collection.end_date : ''}
              onChange={e => this.changeCollection('end_date', e.target.value)}
            />
          </FormGroup>
        </Col>
      </Row>
    );
  }
  AreaOfResearch = (): JSX.Element => {
    const
      collection = this.state.collection,
      countryOrOcean = collection.country_or_ocean ? countries.find( c => c.value === collection.country_or_ocean ) || oceans.find( c => c.value === collection.country_or_ocean ) : null;

    return (
      <Row>
        <Col md="6">
          <FormGroup>
            <Label for="regional_focus">Regional Focus</Label>
            <Select id="regional_focus" options={[ { label: 'Oceans', options: oceans }, { label: 'Countries', options: countries }]} value={[countryOrOcean]} onChange={e => this.validateLength('regional_focus', e.value)} isSearchable/>
            <FormFeedback style={{ display: (this.state.validate.hasOwnProperty('regional_focus') && !this.state.validate.regional_focus ? 'block' : 'none') }}>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
      </Row>
    );
  }
  Event = (): JSX.Element => {
    const
      collection = this.state.collection,
      eventTypes = [
        {label: 'Screening', value: 'Screening'},
        {label: 'Concert', value: 'Concert'},
        {label: 'Performance', value: 'Performance'},
        {label: 'Panel Discussion', value: 'Panel Discussion'},
        {label: 'Convening', value: 'Convening'},
        {label: 'Workshop', value: 'Workshop'},
        {label: 'Seminar', value: 'Seminar'},
        {label: 'Other', value: 'Other'}
      ],
      eventType = collection.event_type ? eventTypes.find( c => c.value === collection.event_type ) : null;

    return (
      <Row>
        <Col md="6">
          <FormGroup>
            <Label for="institution">Institution</Label>
            <Input
              type="text"
              className="institution"
              defaultValue={collection.institution ? collection.institution : ''}
              required
              invalid={this.state.validate.hasOwnProperty('institution') && !this.state.validate.institution}
              onChange={e => this.validateLength('institution', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="start_date">Start Date</Label>
            <Input
              type="date"
              id="start_date"
              defaultValue={collection.start_date ? collection.start_date : ''}
              invalid={this.state.validate.hasOwnProperty('start_date') && !this.state.validate.start_date}
              onChange={e => this.validateLength('start_date', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="end_date">End Date</Label>
            <Input
              type="date"
              id="end_date"
              defaultValue={collection.end_date ? collection.end_date : ''}
              onChange={e => this.changeCollection('end_date', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="curator">Curated By</Label>
            <Input
              type="text"
              className="curator"
              defaultValue={collection.curator ? collection.curator : ''}
              required
              invalid={this.state.validate.hasOwnProperty('curator') && !this.state.validate.curator}
              onChange={e => this.validateLength('curator', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="event_type">Type Of Event</Label>
            <Select
              id="event_type"
              options={eventTypes}
              value={[eventType]}
              onChange={e => this.changeCollection('event_type', e.value)}
              isSearchable
            />
          </FormGroup>
        </Col>
      </Row>
    );
  }
  EventSeries = (): JSX.Element => {
    const collection = this.state.collection;

    return (
      <Row>
        <Col md="6">
          <FormGroup>
            <Label for="venues">Venue</Label>
            <CustomSelect values={!!collection.venues ? collection.venues : null} callback={values => this.validateLength('venues', values)} />
            <FormFeedback style={{ display: (this.state.validate.hasOwnProperty('venues') && !this.state.validate.venues ? 'block' : 'none') }}>This is a required field</FormFeedback>
            <FormText>Use tab or enter to add a Venue.</FormText>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="hosted_by">Hosted By</Label>
            <CustomSelect isMulti values={!!collection.hosted_by ? collection.hosted_by : null} callback={values => this.changeCollection('hosted_by', values)} />
          </FormGroup>
        </Col>

        <Col md="6">
          <FormGroup>
            <Label for="start_date">Start Date</Label>
            <Input
              type="date"
              id="start_date"
              defaultValue={collection.start_date ? collection.start_date : ''}
              invalid={this.state.validate.hasOwnProperty('start_date') && !this.state.validate.start_date}
              onChange={e => this.validateLength('start_date', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="end_date">End Date</Label>
            <Input
              type="date"
              id="end_date"
              defaultValue={collection.end_date ? collection.end_date : ''}
              onChange={e => this.changeCollection('end_date', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="curator">Curated By</Label>
            <Input
              type="text"
              className="curator"
              defaultValue={collection.curator ? collection.curator : ''}
              required
              invalid={this.state.validate.hasOwnProperty('curator') && !this.state.validate.curator}
              onChange={e => this.validateLength('curator', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
      </Row>
    );
  }
  EditedVolume = (): JSX.Element => {
    const collection = this.state.collection;

    return (
      <Row>
        <Col md="6">
          <FormGroup>
            <Label for="editor">Editor</Label>
            <Input
              type="text"
              className="editor"
              defaultValue={collection.editor ? collection.editor : ''}
              required
              invalid={this.state.validate.hasOwnProperty('editor') && !this.state.validate.editor}
              onChange={e => this.validateLength('editor', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="publisher">Publisher</Label>
            <CustomSelect isMulti values={!!collection.publisher ? [collection.publisher] : []} callback={values => this.changeCollection('publisher', values)} />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="year_produced">Year</Label>
            <YearSelect value={collection.year_produced ? collection.year_produced : ''} callback={e => this.validateLength('year_produced', e)}/>
            <FormFeedback style={{ display: (this.state.validate.hasOwnProperty('year_produced') && !this.state.validate.year_produced ? 'block' : 'none') }}>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="city_of_publication">City</Label>
            <Input
              type="text"
              className="city_of_publication"
              defaultValue={collection.city_of_publication ? collection.city_of_publication : ''}
              onChange={e => this.changeCollection('city_of_publication', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="edition">Edition</Label>
            <Input
              type="text"
              className="edition"
              defaultValue={collection.edition ? collection.edition : ''}
              onChange={e => this.changeCollection('edition', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="series_name">Series Name</Label>
            <Input
              type="text"
              className="series_name"
              defaultValue={collection.series_name ? collection.series_name : ''}
              onChange={e => this.changeCollection('series_name', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="volume_in_series">Volume in Series</Label>
            <Input
              type="number"
              className="volume_in_series"
              defaultValue={collection.volume_in_series ? collection.volume_in_series.toString() : ''}
              onChange={e => this.changeCollection('volume_in_series', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="journal">Journal</Label>
            <Input
              type="text"
              className="journal"
              defaultValue={collection.journal ? collection.journal : ''}
              onChange={e => this.changeCollection('journal', e.target.value)}
            />
          </FormGroup>
        </Col>
        {/*<Col md="6">*/}
        {/*  <FormGroup>*/}
        {/*    <Label for="volume">Volume #</Label>*/}
        {/*    <Input type="number" className="volume" defaultValue={collection.volume ? collection.volume.toString() : ''} onChange={e => this.changeCollection('volume', e.target.value)}/>*/}
        {/*  </FormGroup>*/}
        {/*</Col>*/}
        {/*<Col md="6">*/}
        {/*  <FormGroup>*/}
        {/*    <Label for="number">Number</Label>*/}
        {/*    <Input type="number" className="number" defaultValue={collection.number ? collection.number.toString() : ''} onChange={e => this.changeCollection('number', e.target.value)}/>*/}
        {/*  </FormGroup>*/}
        {/*</Col>*/}
        <Col md="6">
          <FormGroup>
            <Label for="isbn">ISBN</Label>
            <CustomSelect values={collection.isbn} callback={values => this.changeCollection('isbn', values)} />
          </FormGroup>
        </Col>

        <Col md="6">
          <FormGroup>
            <Label for="pages">Pages (Count)</Label>
            <Input
              type="number"
              className="pages"
              defaultValue={collection.pages ? collection.pages.toString() : ''}
              onChange={e => this.changeCollection('pages', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="disciplinary_field">Disciplinary Field</Label>
            <Input
              type="text"
              className="disciplinary_field"
              defaultValue={collection.disciplinary_field ? collection.disciplinary_field : ''}
              onChange={e => this.changeCollection('disciplinary_field', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
      </Row>
    );
  }
  Expedition = (): JSX.Element => {
    const collection = this.state.collection;

    return (
      <Row>
        <Col md="6">
          <FormGroup>
            <Label for="start_date">Start Date</Label>
            <Input
              type="date"
              id="start_date"
              defaultValue={collection.start_date ? collection.start_date : ''}
              invalid={this.state.validate.hasOwnProperty('start_date') && !this.state.validate.start_date}
              onChange={e => this.validateLength('start_date', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="end_date">End Date</Label>
            <Input
              type="date"
              id="end_date"
              defaultValue={collection.end_date ? collection.end_date : ''}
              invalid={this.state.validate.hasOwnProperty('end_date') && !this.state.validate.end_date}
              onChange={e => this.changeCollection('end_date', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="expedition_leader">Expedition Leader</Label>
            <Input
              type="text"
              className="expedition_leader"
              defaultValue={collection.expedition_leader ? collection.expedition_leader : ''}
              invalid={this.state.validate.hasOwnProperty('end_date') && !this.state.validate.end_date}
              onChange={e => this.changeCollection('expedition_leader', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="institution">Institution</Label>
            <Input
              type="text"
              className="institution"
              defaultValue={collection.institution ? collection.institution : ''}
              invalid={this.state.validate.hasOwnProperty('institution') && !this.state.validate.institution}
              onChange={e => this.validateLength('institution', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="expedition_vessel">Vessel (if on boat)</Label>
            <Input
              type="text"
              className="expedition_vessel"
              defaultValue={collection.expedition_vessel ? collection.expedition_vessel : ''}
              onChange={e => this.changeCollection('expedition_vessel', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="expedition_route">Expedition Route</Label>
            <Input
              type="text"
              className="expedition_route"
              defaultValue={collection.expedition_route ? collection.expedition_route : ''}
              invalid={this.state.validate.hasOwnProperty('expedition_route') && !this.state.validate.expedition_route}
              onChange={e => this.validateLength('expedition_route', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="expedition_start_point">Expedition Start Point (GPS Lat,Lng)</Label>
            <Input
              type="text"
              className="expedition_start_point"
              defaultValue={collection.expedition_start_point ? collection.expedition_start_point : ''}
              onChange={e => this.changeCollection('expedition_start_point', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="expedition_end_point">Expedition End Point (GPS Lat,Lng)</Label>
            <Input
              type="text"
              className="expedition_end_point"
              defaultValue={collection.expedition_end_point ? collection.expedition_end_point : ''}
              onChange={e => this.changeCollection('expedition_end_point', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="url">Original URL</Label>
            <Input
              type="url"
              id="url"
              defaultValue={collection.url ? collection.url : ''}
              invalid={this.state.validate.hasOwnProperty('url') && !this.state.validate.url}
              onChange={e => {
                const value = e.target.value;
                let valid = validateURL(value);
                if (!value) { valid = true; } // set valid to true for no content
                if (valid) { this.changeCollection('url', value); } // if valid set the data in changedItem
                this.setState({ validate: { ...this.state.validate, url: valid } });
              }}
            />
            <FormFeedback>Not a valid URL</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="participants">Participant(s)</Label>
            <CustomSelect isMulti values={collection.participants} callback={values => this.validateLength('participants', values)} />
            <FormFeedback style={{ display: (this.state.validate.hasOwnProperty('participants') && !this.state.validate.participants ? 'block' : 'none') }}>This is a required field</FormFeedback>
            <FormText>Use tab or enter to add a new Participant.</FormText>
          </FormGroup>
        </Col>
      </Row>
    );
  }
  Exhibition = (): JSX.Element => {
    const collection = this.state.collection;
    return (
      <Row>
        <Col md="6">
          <FormGroup>
            <Label for="institution">Institution</Label>
            <Input
              type="text"
              className="institution"
              defaultValue={collection.institution ? collection.institution : ''}
              required
              invalid={this.state.validate.hasOwnProperty('institution') && !this.state.validate.institution}
              onChange={e => this.validateLength('institution', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="start_date">Start Date</Label>
            <Input
              type="date"
              id="start_date"
              defaultValue={collection.start_date ? collection.start_date : ''}
              invalid={this.state.validate.hasOwnProperty('start_date') && !this.state.validate.start_date}
              onChange={e => this.validateLength('start_date', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="end_date">End Date</Label>
            <Input
              type="date"
              id="end_date"
              defaultValue={collection.end_date ? collection.end_date : ''}
              onChange={e => this.changeCollection('end_date', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="curator">Curated By</Label>
            <Input
              type="text"
              className="curator"
              defaultValue={collection.curator ? collection.curator : ''}
              onChange={e => this.changeCollection('curator', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="related_material">Related Material</Label>
            <CustomSelect isMulti values={collection.related_material} callback={values => this.changeCollection('related_material', values)} />
          </FormGroup>
        </Col>
      </Row>
    );
  }
  Collection = (): JSX.Element => {
    const collection = this.state.collection;

    return (
      <Row>
        <Col md="6">
          <FormGroup>
            <Label for="institution">Institution</Label>
            <Input
              type="text"
              className="institution"
              defaultValue={collection.institution ? collection.institution : ''}
              required
              invalid={this.state.validate.hasOwnProperty('institution') && !this.state.validate.institution}
              onChange={e => this.validateLength('institution', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <InputGroup>
            <CustomInput type="switch" id="digital_collection" name="digital_collection" label="Digital Collection Only?" checked={this.state.collection.digital_collection || false} onChange={e => this.changeCollection('digital_collection', e.target.checked)} />
          </InputGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="department">Department</Label>
            <Input
              type="text"
              className="department"
              defaultValue={collection.department ? collection.department : ''}
              onChange={e => this.changeCollection('department', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="directors">Director</Label>
            <CustomSelect values={collection.directors} callback={values => this.validateLength('directors', values)} />
            <FormFeedback style={{ display: (this.state.validate.hasOwnProperty('directors') && !this.state.validate.directors ? 'block' : 'none') }}>This is a required field</FormFeedback>
            <FormText>Use tab or enter to add a Director.</FormText>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="media_type">Media Type</Label>
            <Input
              type="text"
              className="media_type"
              defaultValue={collection.media_type ? collection.media_type : ''}
              required
              invalid={this.state.validate.hasOwnProperty('media_type') && !this.state.validate.media_type}
              onChange={e => this.validateLength('media_type', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
      </Row>
    );
  }
  Convening = (): JSX.Element => {
    const collection = this.state.collection;

    return (
      <Row>
        <Col md="6">
          <FormGroup>
            <Label for="curator">Curated By</Label>
            <Input
              type="text"
              className="curator"
              defaultValue={collection.curator ? collection.curator : ''}
              onChange={e => this.changeCollection('curator', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="venues">Venue</Label>
            <CustomSelect values={!!collection.venues ? collection.venues : null} callback={values => this.validateLength('venues', values)} />
            <FormFeedback style={{ display: (this.state.validate.hasOwnProperty('venues') && !this.state.validate.venues ? 'block' : 'none') }}>This is a required field</FormFeedback>
            <FormText>Use tab or enter to add a Venue.</FormText>
          </FormGroup>
        </Col>

        <Col md="6">
          <FormGroup>
            <Label for="host_organisation">Host Organization</Label>
            <CustomSelect values={collection.host_organisation} callback={values => this.changeCollection('host_organisation', values)} />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="start_date">Start Date</Label>
            <Input
              type="date"
              id="start_date"
              defaultValue={collection.start_date ? collection.start_date : ''}
              invalid={this.state.validate.hasOwnProperty('start_date') && !this.state.validate.start_date}
              onChange={e => this.validateLength('start_date', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="end_date">End Date</Label>
            <Input
              type="date"
              id="end_date"
              defaultValue={collection.end_date ? collection.end_date : ''}
              onChange={e => this.changeCollection('end_date', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="participants">Participant(s)</Label>
            <CustomSelect isMulti values={collection.participants} callback={values => this.changeCollection('participants', values)} />
          </FormGroup>
        </Col>
      </Row>
    );
  }
  Performance = (): JSX.Element => {
    const collection = this.state.collection;

    return (
      <Row>
        <Col md="6">
          <FormGroup>
            <Label for="venues">Venue</Label>
            <CustomSelect values={!!collection.venues ? collection.venues : null} callback={values => this.validateLength('venues', values)} />
            <FormFeedback style={{ display: (this.state.validate.hasOwnProperty('venues') && !this.state.validate.venues ? 'block' : 'none') }}>This is a required field</FormFeedback>
            <FormText>Use tab or enter to add a Venue.</FormText>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="collaborators">Collaborators</Label>
            <CustomSelect isMulti values={!!collection.collaborators ? collection.collaborators : null} callback={values => this.changeCollection('collaborators', values)} />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="host_organisation">Host Organization</Label>
            <CustomSelect values={collection.host_organisation} callback={values => this.changeCollection('host_organisation', values)} />
          </FormGroup>
        </Col>
      </Row>
    );
  }
  Installation = (): JSX.Element => {
    const collection = this.state.collection;

    return (
      <Row>
        <Col md="6">
          <FormGroup>
            <Label for="installation_name">Installation Name</Label>
            <Input
              type="text"
              className="installation_name"
              defaultValue={collection.installation_name ? collection.installation_name : ''}
              onChange={e => this.changeCollection('installation_name', e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="venues">Venue</Label>
            <CustomSelect values={!!collection.venues ? collection.venues : null} callback={values => this.validateLength('venues', values)} />
            <FormFeedback style={{ display: (this.state.validate.hasOwnProperty('venues') && !this.state.validate.venues ? 'block' : 'none') }}>This is a required field</FormFeedback>
            <FormText>Use tab or enter to add a Venue.</FormText>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="start_date">Start Date</Label>
            <Input
              type="date"
              id="start_date"
              defaultValue={collection.start_date ? collection.start_date : ''}
              invalid={this.state.validate.hasOwnProperty('start_date') && !this.state.validate.start_date}
              onChange={e => this.validateLength('start_date', e.target.value)}
            />
            <FormFeedback>This is a required field</FormFeedback>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label for="end_date">End Date</Label>
            <Input
              type="date"
              id="end_date"
              defaultValue={collection.end_date ? collection.end_date : ''}
              onChange={e => this.changeCollection('end_date', e.target.value)}
            />
          </FormGroup>
        </Col>
      </Row>
    );
  }

  render() {
    const {
      title,
      description,
      subtitle,
      url,
      location,
      copyright_holder,
      copyright_country,
      focus_arts,
      focus_scitech,
      focus_action,

      year_produced,
      country_or_ocean,
      license,

      aggregated_keyword_tags,
      aggregated_concept_tags,

      type

    } = this.state.collection;

    const
      conceptTags = aggregated_concept_tags ? aggregated_concept_tags.map( t => ({ id: t.id, value: t.id, label: t.tag_name }) ) : [],
      keywordTags = aggregated_keyword_tags ? aggregated_keyword_tags.map( t => ({ id: t.id, value: t.id, label: t.tag_name }) ) : [],
      countryOrOcean = country_or_ocean ? countries.find( c => c.value === country_or_ocean ) || oceans.find( c => c.value === country_or_ocean ) : null;

    return (
      <div className="container-fluid collectionEditor">
        <Row>
          <Col xs="12">
            <WarningMessage message={this.state.warningMessage} />
            <ErrorMessage message={this.state.errorMessage} />
            <SuccessMessage message={this.state.successMessage} />
          </Col>
        </Row>

        <Row>
          <Col>
            <Row>
              <Col xs="12">
                <InputGroup>
                  <Input
                    className={`${this.state.titleEnabled ? '' : 'border-0'} bg-white`}
                    id="title"
                    defaultValue={title ? title : ''}
                    placeholder="Please Enter A Title"
                    onChange={e => this.validateLength('title', e.target.value)}
                    disabled={!this.state.titleEnabled}
                    required
                    invalid={this.state.validate.hasOwnProperty('title') && !this.state.validate.title}
                  />
                  <InputGroupAddon addonType="append">
                    <InputGroupText className="border-0 bg-white">
                      <img
                        src={pencil}
                        alt="Edit Item"
                        onClick={() => this.setState(prevState => ({ titleEnabled: !prevState.titleEnabled }))}
                      />
                    </InputGroupText>
                  </InputGroupAddon>
                  <FormFeedback>This is a required field</FormFeedback>
                </InputGroup>
              </Col>
            </Row>

            <Row>
              <Col md="12">
                <UncontrolledButtonDropdown className="float-right">
                  <Button id="caret" onClick={this.putCollection} disabled={!this.state.isDifferent}>Save</Button>
                  <DropdownToggle caret />
                  <DropdownMenu>
                    {this.state.originalCollection.status ?
                      <DropdownItem onClick={() => { this.changeCollection('status', false); this.putCollection(); }}>Unpublish</DropdownItem> :
                      <DropdownItem onClick={() => { this.changeCollection('status', true); this.putCollection(); }}>Publish</DropdownItem>
                    }
                  </DropdownMenu>
                </UncontrolledButtonDropdown>
              </Col>
            </Row>
          </Col>

          <Col md="8">
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={this.state.activeTab === '1' ? 'active' : ''}
                  onClick={() => { if (this._isMounted) { this.setState({ activeTab: '1' }); }}}
                >
                  Details
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={this.state.activeTab === '2' ? 'active' : ''}
                  onClick={() => { if (this._isMounted) { this.setState({ activeTab: '2' }); }}}
                >
                  Taxonomy
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={this.state.activeTab === '3' ? 'active' : ''}
                  onClick={() => { if (this._isMounted) { this.setState({ activeTab: '3' }); }}}
                >
                  Items
                </NavLink>
              </NavItem>
            </Nav>
            <TabContent activeTab={this.state.activeTab}>
              <TabPane tabId="1">
                <Row>
                  <Col>
                    <FormGroup>
                      <Label for="subtitle">Subtitle</Label>
                      <Input
                        type="text"
                        className="subtitle"
                        defaultValue={subtitle ? subtitle : ''}
                        onChange={e => this.changeCollection('subtitle', e.target.value)}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label for="description">Description</Label>
                      <Input
                        type="textarea"
                        id="description"
                        defaultValue={description ? description : ''}
                        onChange={e => this.validateLength('description', e.target.value)}
                        invalid={this.state.validate.hasOwnProperty('description') && !this.state.validate.description}
                      />
                      <FormFeedback>This is a required field</FormFeedback>
                    </FormGroup>

                    <FormGroup>
                      <Label for="year_produced">Year Produced</Label>
                      <YearSelect value={year_produced ? year_produced : ''} callback={e => this.changeCollection('year_produced', e)}/>
                    </FormGroup>

                    <FormGroup>
                      <Label for="country_or_ocean">Region (Country/Ocean)</Label>
                      <Select id="country_or_ocean" options={[ { label: 'Oceans', options: oceans }, { label: 'Countries', options: countries }]} value={[countryOrOcean]} onChange={e => this.changeCollection('country_or_ocean', e.value)} isSearchable/>
                    </FormGroup>

                    <FormGroup>
                      <Label for="location">Location</Label>
                      <Input type="text" id="location" defaultValue={location ? location : ''} onChange={e => this.changeCollection('location', e.target.value)}/>
                    </FormGroup>

                    <FormGroup>
                      <Label for="type">Type</Label>
                      <Select id="type" options={collectionTypes} value={[collectionTypes.find( o => o.label === type)]} onChange={e => this.validateLength('type', e.value)} isSearchable/>
                      <FormFeedback style={{ display: (this.state.validate.hasOwnProperty('type') && !this.state.validate.type ? 'block' : 'none') }}>This is a required field</FormFeedback>
                    </FormGroup>

                    <FormGroup>
                      <Label for="license_type">License</Label>
                      <Select id="license_type" options={licenseType} value={license ? {value: license, label: license} : []} onChange={e => this.changeCollection('license', e.label)} isSearchable/>
                    </FormGroup>

                    <FormGroup>
                      <Label for="copyright_holder">Copyright Holder</Label>
                      <Input type="text" id="copyright_holder" defaultValue={copyright_holder ? copyright_holder : ''} onChange={e => this.changeCollection('copyright_holder', e.target.value)}/>
                    </FormGroup>

                    <FormGroup>
                      <Label for="copyright_country">Copyright Country</Label>
                      <Select id="copyright_country" options={countries} value={[copyright_country ? countries.find(c => c.value === copyright_country) : null]} onChange={e => this.changeCollection('copyright_country', e.value)} isSearchable/>
                    </FormGroup>

                    <FormGroup>
                      <Label for="url">Original URL</Label>
                      <Input
                        type="url"
                        id="url"
                        defaultValue={url ? url : ''}
                        invalid={this.state.validate.hasOwnProperty('url') && !this.state.validate.url}
                        onChange={e => {
                          const value = e.target.value;
                          let valid = validateURL(value);
                          if (!value) { valid = true; } // set valid to true for no content
                          if (valid) { this.changeCollection('url', value); } // if valid set the data in collection
                          this.setState({ validate: { ...this.state.validate, url: valid } });
                        }}
                      />
                      <FormFeedback>Not a valid URL</FormFeedback>
                    </FormGroup>

                  </Col>
                </Row>

                {type === Types.Series ? <this.Series /> : <></>}
                {type === Types.Area_of_Research ? <this.AreaOfResearch /> : <></>}
                {type === Types.Event ? <this.Event /> : <></>}
                {type === Types.Event_Series ? <this.EventSeries /> : <></>}
                {type === Types.Edited_Volume ? <this.EditedVolume /> : <></>}
                {type === Types.Expedition ? <this.Expedition /> : <></>}
                {type === Types.Collection ? <this.Collection /> : <></>}
                {type === Types.Convening ? <this.Convening /> : <></>}
                {type === Types.Performance ? <this.Performance /> : <></>}
                {type === Types.Installation ? <this.Installation /> : <></>}

              </TabPane>
              <TabPane tabId="2">
                <Row>
                  <Col>
                    <FormGroup>
                      <Label for="concept_tags">Concept Tags</Label>
                      <Tags
                        className="concept_tags"
                        type="concept"
                        defaultValues={conceptTags}
                        callback={tags => this.validateLength('concept_tags', tags ? tags.map(tag => tag.id) : [])}
                      />
                      <FormFeedback style={{ display: (this.state.validate.hasOwnProperty('concept_tags') && !this.state.validate.concept_tags ? 'block' : 'none') }}>This is a required field</FormFeedback>
                    </FormGroup>

                    <FormGroup>
                      <Label for="keyword_tags">Keyword Tags</Label>
                      <Tags
                        className="keyword_tags"
                        type="keyword"
                        defaultValues={keywordTags}
                        callback={tags => this.changeCollection('keyword_tags', tags ? tags.map(tag => tag.id) : [])}
                      />
                    </FormGroup>

                    <FormGroup>
                      <legend>Focus</legend>
                      <Label for="art">Art</Label>
                      <Input
                        className="art"
                        type="range"
                        step="1"
                        min="0"
                        max="3"
                        value={focus_arts ? focus_arts : 0}
                        onChange={e => this.validateLength('focus_arts', e.target.value)}
                        invalid={this.state.validate.hasOwnProperty('focus_arts') && !this.state.validate.focus_arts}
                      />
                      <FormFeedback>This is a required field</FormFeedback>

                      <Label for="scitech">Sci Tech</Label>
                      <Input
                        className="scitech"
                        type="range"
                        step="1"
                        min="0"
                        max="3"
                        value={focus_scitech ? focus_scitech : 0}
                        onChange={e => this.validateLength('focus_scitech', e.target.value)}
                        invalid={this.state.validate.hasOwnProperty('focus_scitech') && !this.state.validate.focus_scitech}
                      />
                      <FormFeedback>This is a required field</FormFeedback>
                      <Label for="action">Action</Label>
                      <Input
                        className="action"
                        type="range"
                        step="1"
                        min="0"
                        max="3"
                        value={focus_action ? focus_action : 0}
                        onChange={e => this.validateLength('focus_action', e.target.value)}
                        invalid={this.state.validate.hasOwnProperty('focus_action') && !this.state.validate.focus_action}
                      />
                      <FormFeedback>This is a required field</FormFeedback>
                    </FormGroup>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tabId="3">
                <Row>
                  {
                    this.state.loadingItems ?
                      <>Loading</>
                      :
                      <Items callback={this.itemsCallback} items={this.state.loadedItems}/>
                  }
                </Row>
              </TabPane>
            </TabContent>
          </Col>
        </Row>
      </div>
    );
  }
}