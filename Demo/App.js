'use strict';

import React, { Component } from 'react';
import {
  Text,
  View,
  Dimensions,
  ScrollView
} from 'react-native';

import ViewPager from '@ldn0x7dc/react-native-view-pager';

export default class App extends Component {

  constructor(props) {
    super(props);
    this.pageDataList = [];
    for(let i = 0; i < 100; i++) {
      this.pageDataList.push('page#' + i);
    }
  }

  render() {
    return (
      <ViewPager
        style={{backgroundColor: 'white'}}
        renderPage={this.renderPage.bind(this)}
        pageDataList={this.pageDataList}
        initialPage={3}
        pageMargin={20}
      />
    );
  }

  renderPage(pageData, pageId, layout) {
    console.log('renderPage...layout=' + JSON.stringify(layout));
    return (
      <View style={{flex: 1}}>
        <View
          style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ccc'}}>
          <Text>{pageId + ' ' + pageData}</Text>
        </View>
      </View>
    );
  }
}