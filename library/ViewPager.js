import React, { PropTypes, Component } from 'react';
import {
  View,
  ListView
} from 'react-native';

import Image from 'react-native-transformable-image';
import Scroller from 'react-native-scroller';
import {createResponder} from 'react-native-gesture-responder';

const MIN_FLING_VELOCITY = 0.5;
let DEV = false;

export default class ViewPager extends Component {

  static enableDebug() {
    DEV = true;
  }

  static propTypes = {
    ...View.propTypes,
    initialPage: PropTypes.number,
    pageMargin: PropTypes.number,
    renderPage: PropTypes.func,
    pageDataList: PropTypes.array,
  }

  static defaultProps = {
    initialPage: 0,
    pageDataList: [],
    pageMargin: 0
  }

  constructor(props) {
    super(props);

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.dataSource = ds.cloneWithRows([]);
    this.state = {
      width: 0,
      height: 0
    }

    this.currentPage = 0;
    this.pageCount = 0;
    this.initialPageSettled = false;

    this.scroller = new Scroller(true, (dx, dy, scroller) => {
      if (dx === 0 && dy === 0 && scroller.isFinished()) {

      } else {
        this.refs['innerListView'].scrollTo({x: this.scroller.getCurrX(), animated: false});
      }
    });
  }

  componentWillMount() {
    this.gestureResponder = createResponder({
      onStartShouldSetResponder: (evt, gestureState) => true,
      onResponderGrant: this.onResponderGrant.bind(this),
      onResponderMove: this.onResponderMove.bind(this),
      onResponderRelease: this.onResponderRelease.bind(this)
    });
  }

  onResponderGrant(evt, gestureState) {
    this.scroller.forceFinished(true);
  }

  onResponderMove(evt, gestureState) {
    let dx = gestureState.moveX - gestureState.previousMoveX;
    this.scrollByOffset(dx);
  }

  onResponderRelease(evt, gestureState) {
    this.settlePage(gestureState.vx);
  }

  render() {
    if(this.state.width && this.state.height) {
      let list = this.props.pageDataList;
      this.dataSource = this.dataSource.cloneWithRows(list);
      this.pageCount = list.length;
    }

    return (
      <View
        {...this.props}
        style={[this.props.style, {flex: 1}]}
        {...this.gestureResponder}>
        <ListView
          style={{flex: 1}}
          ref='innerListView'
          scrollEnabled={false}
          horizontal={true}
          enableEmptySections={true}
          dataSource={this.dataSource}
          renderRow={this.renderRow.bind(this)}
          onLayout={this.onLayout.bind(this)}
        />
      </View>
    );
  }

  renderRow(rowData, sectionID, rowID, highlightRow) {
    const {width, height} = this.state;
    let page = this.props.renderPage(rowData, rowID, {width, height});

    let newProps = {
      ...page.props,
      style: [page.props.style, {
        width: this.state.width,
        height: this.state.height,
        position: 'relative',
        marginLeft: 0,
        marginRight: rowID === this.pageCount - 1 ? 0 : this.props.pageMargin,
      }]
    };

    return React.createElement(page.type, newProps);
  }

  onLayout(e) {
    let {width, height} = e.nativeEvent.layout;
    let sizeChanged = this.state.width !== width || this.state.height !== height;
    if (width && height && sizeChanged) {
      this.setState({
        width, height
      });
    }
  }

  componentDidUpdate() {
    if (!this.initialPageSettled) {
      this.initialPageSettled = true;
      this.scrollToPage(this.props.initialPage);
    }
  }

  settlePage(vx) {
    if (vx < -MIN_FLING_VELOCITY) {
      if (this.currentPage < this.pageCount - 1) {
        this.flingToPage(this.currentPage + 1, vx);
      } else {
        this.flingToPage(this.pageCount - 1, vx);
      }
    } else if (vx > MIN_FLING_VELOCITY) {
      if (this.currentPage > 0) {
        this.flingToPage(this.currentPage - 1, vx);
      } else {
        this.flingToPage(0, vx);
      }
    } else {
      let page = this.currentPage;
      let progress = (this.scroller.getCurrX() - this.getScrollOffsetOfPage(this.currentPage)) / this.state.width;
      if (progress > 1 / 3) {
        page += 1;
      } else if (progress < -1 / 3) {
        page -= 1;
      }
      page = Math.min(this.pageCount - 1, page);
      page = Math.max(0, page);
      this.scrollToPage(page);
    }
  }

  getScrollOffsetOfPage(page) {
    if(page === 0) {
      return 0;
    }
    return page * this.state.width + page * this.props.pageMargin;
  }

  flingToPage(page, velocityX) {
    page = this.validPage(page);

    velocityX *= -1000; //per sec
    const finalX = this.getScrollOffsetOfPage(page);
    this.scroller.fling(this.scroller.getCurrX(), 0, velocityX, 0, finalX, finalX, 0, 0);
    this.setPage(page);
  }

  scrollToPage(page) {
    page = this.validPage(page);

    const finalX = this.getScrollOffsetOfPage(page);
    this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 200);
    this.setPage(page);
  }

  scrollByOffset(dx) {
    this.scroller.startScroll(this.scroller.getCurrX(), 0, -dx, 0, 0);
  }

  setPage(page) {
    this.currentPage = this.validPage(page);
  }

  validPage(page) {
    page = Math.min(this.pageCount - 1, page);
    page = Math.max(0, page);
    return page;
  }
}