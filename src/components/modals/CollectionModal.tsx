import * as React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';

import { fetchCollection } from 'actions/collections/viewCollection';
import { toggle } from 'actions/modals/collectionModal';
import { HomepageData } from 'reducers/home';
import { FaTimes } from 'react-icons/fa';
import { Col, Modal, ModalBody, Row } from 'reactstrap';
import ViewCollection from '../collection/ViewCollection';
import { Collection } from '../../types/Collection';
import HistoryComponent from '../history/HistoryComponent';
import { popEntity as popHistoryEntity } from '../../actions/history';

interface Props {
  data?: HomepageData | Collection;
  collection?: Collection;
  open: boolean;
  toggle?: Function;
  customToggle?: Function;
  fetchCollection?: Function;
  popHistoryEntity: Function;
}

interface State {
  open: boolean;
  modalBodyID?: string;
}

class CollectionModal extends React.Component<Props, State> {
  _isMounted;

  constructor(props: Props) {
    super(props);
    this._isMounted = false;

    this.state = {
      open: false
    };
  }

  componentDidMount(): void {
    this._isMounted = true;

    this.setState({ open: this.props.open });

    if (this.props.data && typeof this.props.fetchCollection === 'function') {
      this.props.fetchCollection(this.props.data.id);
    }

    const modalBodyID = this.generateModalBodyID();
    if (modalBodyID.length) {
      this.setState({ modalBodyID });
    }
  }

  componentWillUnmount = () => {
    this._isMounted = false;
  }

  async componentDidUpdate(prevProps: Readonly<Props>): Promise<void> {
    if (this._isMounted) {
      const state = {};

      if (this.props.data && !isEqual(this.props.data, prevProps.data) && typeof this.props.fetchCollection === 'function') {
        this.props.fetchCollection(this.props.data.id);

        const data = this.props.collection || this.props.data;
        if (data) {
          const modalBodyID = this.generateModalBodyID();
          if (modalBodyID.length) {
            Object.assign(state, { modalBodyID });
          }
        }
      }

      if (this.props.open !== prevProps.open) {
        Object.assign(state, { open: this.props.open });
      }

      if (Object.keys(state).length > 0) {
        this.setState(state);
      }
    }
  }

  generateModalBodyID = (): string => {
    const data = this.props.collection || this.props.data;
    if (data) {
      return `${data.id}_${Date.now()}`;
    } else {
      return '';
    }
  }

  render() {
    const data = this.props.collection || this.props.data;

    const modalToggle = (state: boolean = false): void => {
      this.props.popHistoryEntity(data);

      if (typeof this.props.customToggle === 'function') {
        this.props.customToggle(state);
      } else if (typeof this.props.toggle === 'function') {
         this.props.toggle(state);
      }
    };

    if (data) {
      return (
        <Modal id="homePageModal" scrollable className="fullwidth" isOpen={this.state.open} backdrop toggle={() => modalToggle()}>
          <Row className="header align-content-center">
            <div className="col-11 title-wrapper d-flex align-content-center">
              <div className="title">
              <span className="ellipsis">
                {data.title}
              </span>
              </div>
            </div>
            <Col xs="1" className="pl-0 pr-3">
              <div className="text-right">
                <FaTimes className="closeButton" onClick={() => modalToggle(false)}/>
              </div>
            </Col>
          </Row>

          <ModalBody id={this.state.modalBodyID}>
            <Row>
              <Col>
                <HistoryComponent />
              </Col>
            </Row>
            {
              this.props.collection ?
                <ViewCollection noRedux={true} collection={this.props.collection}/>
                :
                <ViewCollection modalBodyID={this.state.modalBodyID}/>
            }
          </ModalBody>

        </Modal>
      );
    } else {
      return <></>;
    }
  }
}

const mapStateToProps = (state: { collectionModal: { open: boolean, data?: HomepageData | Collection } }, props: {collection?: Collection, open?: boolean, toggle?: Function}) => ({
  data: state.collectionModal.data,
  open: props.open || state.collectionModal.open,
  customToggle: props.toggle,
  collection: props.collection
});

export default connect(mapStateToProps, { toggle, fetchCollection, popHistoryEntity })(CollectionModal);
