import { useCallback, useImperativeHandle, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

// Drop-in replacement for react-tinder-card, which stopped at React 18.
// Keeps the same surface the deck relies on: an imperative ref.swipe(dir),
// onSwipe when the card commits, and onCardLeftScreen once it has flown off.

const DISTANCE_THRESHOLD = 100;   // px of travel that commits a swipe
const VELOCITY_THRESHOLD = 0.5;   // ...or a quick flick, even if short
const FLY_OUT_ROTATION = 30;
// The exit is a fixed-duration tween, not a spring. A spring covering a whole
// viewport width takes seconds to fall under react-spring's rest threshold, and
// onCardLeftScreen drives deck refill + re-enables the buttons — so it has to
// land as soon as the card is actually gone, not whenever the physics settle.
const FLY_OUT_MS = 320;

export default function SwipeCard({
    ref,
    className,
    onSwipe,
    onCardLeftScreen,
    preventSwipe = [],
    children
}) {
    const [{ x, y, rotate }, api] = useSpring(() => ({
        x: 0,
        y: 0,
        rotate: 0,
        config: { tension: 300, friction: 30 }
    }));

    // A card can only leave once, however it was triggered (drag or button).
    const committed = useRef(false);
    const announced = useRef(false);

    const flyOut = useCallback((direction) => {
        if (committed.current) { return }
        committed.current = true;
        onSwipe?.(direction);

        // Far enough that the card is off-screen on any viewport.
        const travel = Math.max(window.innerWidth, window.innerHeight) * 1.5;
        api.start({
            x: direction === 'left' ? -travel : direction === 'right' ? travel : 0,
            y: direction === 'up' ? -travel : direction === 'down' ? travel : 0,
            rotate: direction === 'left' ? -FLY_OUT_ROTATION : direction === 'right' ? FLY_OUT_ROTATION : 0,
            config: { duration: FLY_OUT_MS },
            onRest: () => {
                // onRest can fire per animated key; only report the exit once.
                if (announced.current) { return }
                announced.current = true;
                onCardLeftScreen?.();
            }
        });
    }, [api, onSwipe, onCardLeftScreen]);

    useImperativeHandle(ref, () => ({
        swipe: (direction = 'right') => flyOut(direction),
        restoreCard: () => {
            committed.current = false;
            announced.current = false;
            api.start({ x: 0, y: 0, rotate: 0 });
        }
    }), [api, flyOut]);

    const bind = useDrag(({ down, movement: [mx, my], velocity: [vx, vy] }) => {
        if (committed.current) { return }

        if (down) {
            // Follow the pointer, tilting proportionally to horizontal travel.
            api.start({ x: mx, y: my, rotate: mx / 20, immediate: true });
            return;
        }

        const horizontal = Math.abs(mx) > Math.abs(my);
        const direction = horizontal ? (mx > 0 ? 'right' : 'left') : (my > 0 ? 'down' : 'up');
        const travelled = Math.abs(horizontal ? mx : my);
        const speed = horizontal ? vx : vy;
        const shouldLeave = travelled > DISTANCE_THRESHOLD || speed > VELOCITY_THRESHOLD;

        if (shouldLeave && !preventSwipe.includes(direction)) {
            flyOut(direction);
        } else {
            api.start({ x: 0, y: 0, rotate: 0 });
        }
    });

    return (
        <animated.div
            {...bind()}
            className={className}
            style={{ x, y, rotate, touchAction: 'none' }}
        >
            {children}
        </animated.div>
    );
}
