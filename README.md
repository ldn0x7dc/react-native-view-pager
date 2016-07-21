# react-native-view-pager

A ListView backed ViewPager component for react-native apps. More flexible than ViewPagerAndroid.

## Install

`npm install --save @ldn0x7dc/react-native-view-pager@latest` 

The private scope `@ldn0x7dc` exists because this name has already been taken.

## Documentation

```
import ViewPager from '@ldn0x7dc/react-native-view-pager';
...
render() {
    return (
      <ViewPager
        style={{flex: 1}}
        renderPage={(pageData, pageId, layout) => {}}
        pageDataArray={['your', 'data', 'array']}
      />
    );
  }
```

#### Props

Most of the props mimics those of ViewPagerAndroid. But differences exist.

* `renderPage` : (pageData, pageId, layout) => renderable

  For your convenience, The **layout** object ({width, height}) contains the width and height of this ViewPager. The renderable returned here will be overridden with ViewPager's width and height.


* `pageDataArray` : Custom data array of your pages. 


* `initialPage` : Index of initial page that should be selected. 



* `onPageScroll` : (event) => {}. 

  The event object carries following data: 

  * *position*:  index of first page from the left that is currently visible 
  * *offset*: value from range [0,1) describing stage between page transitions. 
  * *fraction*: means that (1 - x) fraction of the page at "position" index is visible, and x fraction of the next page is visible.

* `onPageScrollStateChanged` : (state) => {}. 

  Called when the page scrolling state has changed. The page scrolling state can be in 3 states:  

  * idle: there is no interaction with the page scroller happening at the time
  * dragging: there is currently an interaction with the page scroller
  * settling: there was an interaction with the page scroller, and the page scroller is now finishing it's closing or opening animation 

* `onPageSelected` : (page) => {}.

  Called with the index of page that has been selected.

* `pageMargin` : number

  blank space to show between pages.

* `scrollEnabled` : bool

  When false, the content does not scroll. The default value is true.

#### Methods

* `setPage(page, immediate)`

  A helper function to scroll to a specific page in the ViewPager. The transition between pages will be animated if `immediate` is not provided or false.