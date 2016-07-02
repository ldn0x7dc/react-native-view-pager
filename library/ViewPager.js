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
    scrollEnabled: PropTypes.bool,
    renderPage: PropTypes.func,
    pageDataArray: PropTypes.array,

    onPageSelected: PropTypes.func,
    onPageScrollStateChanged: PropTypes.func,
    onPageScroll: PropTypes.func,
  };

  static defaultProps = {
    initialPage: 0,
    pageMargin: 0,
    scrollEnabled: true,
    pageDataArray: [],
  };

  constructor(props) {
    super(props);

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.dataSource = ds.cloneWithRows([]);
    this.state = {
      width: 0,
      height: 0
    }

    this.currentPage; //not initialized
    this.pageCount = 0;
    this.initialPageSettled = false;
    this.activeGesture = false;

    this.scroller = new Scroller(true, (dx, dy, scroller) => {
      if (dx === 0 && dy === 0 && scroller.isFinished()) {
        if(!this.activeGesture) {
          this.changePageScrollState('idle');
        }
      } else {
        const curX = this.scroller.getCurrX();
        this.refs['innerListView'].scrollTo({x: curX, animated: false});

        let position = Math.floor(curX / (this.state.width + this.props.pageMargin));
        position = this.validPage(position);
        let offset = (curX - this.getScrollOffsetOfPage(position)) / (this.state.width + this.props.pageMargin);
        let fraction = (curX - this.getScrollOffsetOfPage(position) - this.props.pageMargin) / this.state.width;
        if(fraction < 0) {
          fraction = 0;
        }
        this.props.onPageScroll && this.props.onPageScroll({
          position, offset, fraction
        });
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
    this.activeGesture = true;
    this.changePageScrollState('dragging');
  }

  onResponderMove(evt, gestureState) {
    let dx = gestureState.moveX - gestureState.previousMoveX;
    this.scrollByOffset(dx);
  }

  onResponderRelease(evt, gestureState, disableSettle) {
    this.activeGesture = false;
    this.changePageScrollState('settling');
    if(!disableSettle) {
      this.settlePage(gestureState.vx);
    }
  }

  render() {
    if(this.state.width && this.state.height) {
      let list = this.props.pageDataArray;
      if(!list) {
        list = [];
      }
      this.dataSource = this.dataSource.cloneWithRows(list);
      this.pageCount = list.length;
    }

    let gestureResponder = this.gestureResponder;
    if(!this.props.scrollEnabled || this.pageCount <= 0) {
      gestureResponder = {};
    }

    return (
      <View
        {...this.props}
        {...gestureResponder}>
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
      ref: page.ref,
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
    return page * (this.state.width + this.props.pageMargin);
  }

  flingToPage(page, velocityX) {
    page = this.validPage(page);
    this.changePage(page);

    velocityX *= -1000; //per sec
    const finalX = this.getScrollOffsetOfPage(page);
    this.scroller.fling(this.scroller.getCurrX(), 0, velocityX, 0, finalX, finalX, 0, 0);

  }

  scrollToPage(page, immediate) {
    page = this.validPage(page);
    this.changePage(page);

    const finalX = this.getScrollOffsetOfPage(page);
    if(immediate) {
      this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 0);
    } else {
      this.scroller.startScroll(this.scroller.getCurrX(), 0, finalX - this.scroller.getCurrX(), 0, 200);
    }

  }

  changePage(page) {
    if(this.currentPage !== page) {
      this.currentPage = page;
      this.props.onPageSelected && this.props.onPageSelected(page);
    }
  }

  changePageScrollState(state) {
    this.props.onPageScrollStateChanged && this.props.onPageScrollStateChanged(state);
  }

  scrollByOffset(dx) {
    this.scroller.startScroll(this.scroller.getCurrX(), 0, -dx, 0, 0);
  }

  validPage(page) {
    page = Math.min(this.pageCount - 1, page);
    page = Math.max(0, page);
    return page;
  }

  /**
   * A helper function to scroll to a specific page in the ViewPager.
   * @param page
   * @param immediate If true, the transition between pages will not be animated.
   */
  setPage(page, immediate) {
    this.scrollToPage(page, immediate);
  }

  getScrollOffsetFromCurrentPage() {
    return this.scroller.getCurrX() - this.getScrollOffsetOfPage(this.currentPage);
  }
}