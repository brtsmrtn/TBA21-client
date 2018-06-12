import * as React from 'react';
import { Table } from 'reactstrap';
import { OceanObject, TableRow  } from './TableRow';

interface OceanObjectResults {
  Items: Array<OceanObject>;
  Count: number;
  ScannedCount: number;
}

export class ArchiveTable extends React.Component<{}, OceanObjectResults> {

  state: OceanObjectResults = {Items: [{ocean: '', timestamp: 1, itemId: '', position: [0, 0], description: '', url: '', artist: ''}], Count: 1, ScannedCount: 1};

  componentDidMount() {
    fetch('https://4984s3d656.execute-api.eu-central-1.amazonaws.com/prod/items')
    .then((result: any) =>  { // tslint:disable-line:no-any
      return result.json();
    }).then((data) => {
      this.setState(data);
    });
  }

  render() {

    return (
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>Description</th>
            <th>Artist</th>
            <th>Link</th>
            <th>Map</th>
          </tr>
        </thead>
        <tbody>
          {(this.state.Items).map(item => {
            console.log(item); // tslint:disable-line:no-console
            return <TableRow key={item.itemId} {...item} />;
          })}
        </tbody>
      </Table>
    );
  }
}
