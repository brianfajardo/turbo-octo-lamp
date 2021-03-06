import React, { Component } from 'react'
import {
  View,
  PanResponder,
  Animated,
  Dimensions,
  LayoutAnimation,
  UIManager
} from 'react-native'
import PropTypes from 'prop-types'

import styles from '../../styles/Deck_styles'

// Dynamically setting input range to best match width of user device
const SCREEN_WIDTH = Dimensions.get('window').width
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3
const FORCE_SWIPE_DURATION = 250

class Deck extends Component {

  constructor() {
    super()
    const position = new Animated.ValueXY()
    const panResponder = PanResponder.create({
      // Return true ~> this PanResponder is responsible for event.
      // Return false ~> this PanResponder is not responsible for event.
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gesture) => position.setValue({ x: gesture.dx, y: gesture.dy }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          this.forceSwipeThrough('right')
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this.forceSwipeThrough('left')
        } else {
          this.resetCardPosition()
        }
      }
    })
    this.state = { position, panResponder }
  }

  componentWillUpdate() {
    // For support with Android devices.
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true)
    // Whenever this component is updated/re-rendered, it
    // needs to animate any changes made to the component itself.
    // In this case, the positioning of the cascading cards.
    LayoutAnimation.spring()
  }

  onSwipeComplete(direction) {
    const {
      data,
      onSwipeLeft,
      onSwipeRight,
      currentCardIndex,
     } = this.props
    const item = data[currentCardIndex]
    if (direction === 'right') {
      onSwipeRight(item)
    } else if (direction === 'left' && currentCardIndex > 0) {
      onSwipeLeft(item)
    } else {
      this.resetCardPosition()
    }
    this.state.position.setValue({ x: 0, y: 0 })
  }

  rotateCard() {
    const { position } = this.state
    // Interpolating x amount of pixel drag (inputRange)
    // to degrees of rotation (outputRange)
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: ['-80deg', '0deg', '80deg']
    })
    return {
      ...position.getLayout(),
      // Animated.View will see the change in the rotate
      // interpolation objectand apply it to the rotate prop.
      transform: [{ rotate }]
    }
  }

  forceSwipeThrough(direction) {
    const x = (direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH)
    Animated.timing(this.state.position, {
      toValue: { x, y: 0 },
      duration: FORCE_SWIPE_DURATION
    }).start(() => this.onSwipeComplete(direction))
  }

  resetCardPosition() {
    Animated.spring(this.state.position, {
      toValue: { x: 0, y: 0 }
    }).start()
  }

  renderCards() {
    const {
      data,
      renderCard,
      renderEndOfCards,
      currentCardIndex,
    } = this.props
    if (currentCardIndex >= data.length) {
      return renderEndOfCards()
    }
    return data.map((photo, index) => {
      // If cards have already been swiped, return null.
      // If index matches currentCardIndex, apply Animation
      // and PanResponder props & handlers.
      if (index < currentCardIndex) {
        return null
      } else if (index === currentCardIndex) {
        return (
          <Animated.View
            key={photo.id}
            style={[this.rotateCard(), styles.cardStyle]}
            {...this.state.panResponder.panHandlers}
          >
            {renderCard(photo)}
          </Animated.View >
        )
      }
      return (
        <Animated.View
          key={photo.id}
          style={[styles.cardStyle, { top: 10 * (index - currentCardIndex) }]}
        >
          {renderCard(photo)}
        </Animated.View>
      )
      // Last element appears on top of stack,
      // need to reverse .map array of elements.
    }).reverse()
  }

  render() {
    return (
      <View>
        {this.props.data.length > 0 && this.renderCards()}
      </View>
    )
  }
}

Deck.propTypes = {
  data: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]).isRequired,
  renderCard: PropTypes.func.isRequired,
  onSwipeLeft: PropTypes.func.isRequired,
  onSwipeRight: PropTypes.func.isRequired,
  currentCardIndex: PropTypes.number.isRequired,
  renderEndOfCards: PropTypes.func.isRequired
}

export default Deck