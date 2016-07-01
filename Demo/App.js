'use strict';

import React, { Component } from 'react';
import {
  Text,
  View,
  Dimensions,
  ScrollView,
  TouchableOpacity
} from 'react-native';

import ViewPager from '@ldn0x7dc/react-native-view-pager';

export default class App extends Component {

  constructor(props) {
    super(props);
    this.pageDataArray = [];
    for(let i = 0; i < 100; i++) {
      this.pageDataArray.push('page#' + i);
    }
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <ViewPager
          ref='viewPager'
          style={{flex: 1, backgroundColor: 'white'}}
          renderPage={this.renderPage.bind(this)}
          pageDataArray={this.pageDataArray}
          initialPage={3}
          pageMargin={20}
          scrollEnabled={true}
          onPageScroll={(e) => {
            console.log('onPageScroll...' + JSON.stringify(e))
          }}
          onPageScrollStateChanged={(state) => {
             console.log('onPageScrollStateChanged...' + state);
          }}
          onPageSelected={(page) => {
            console.log('onPageSelected...' + page);
          }}
        />
        <TouchableOpacity
          onPress={() => {
            this.refs['viewPager'].setPage(1, true);
          }}
          style={{height: 50, alignItems: 'center', justifyContent: 'center'}}>
          <Text>setPage</Text>
        </TouchableOpacity>
      </View>

    );
  }

  renderPage(pageData, pageId, layout) {
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