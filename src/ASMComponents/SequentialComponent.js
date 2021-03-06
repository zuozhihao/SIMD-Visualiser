import React from "react";
import styled from "styled-components";
import anime from 'animejs';

const Container = styled.div`
  margin: 20px 0;
  opacity: 0;
`

export default class SequentialComponent extends React.Component {

    constructor() {
        super();
        // create li DOM reference
        this.container = React.createRef();
        this.component = React.createRef();
    }

    allAnimationCompleted() {
        this.props.onComplete(this.props.index);
        //Remove sequential highlight since the component is done animating.
        if (this.sequentialHighlight)
            this.sequentialHighlight.clear();
    }

    componentDidMount() {
        this.childAnimation = false;
        let c = this.component.current;
        if (c && c.getAnimation) {
            this.childAnimation = c.getAnimation();
        }

        this.animeRef = anime({
            targets: this.container.current,
            easing: "easeOutCubic",
            autoplay: false,
            translateY: ['5vh', 0],
            duration: 500,
            delay: 800,
            opacity: 1,
            complete: () => {
                if (this.childAnimation) {
                    this.childAnimation.restart();
                    this.timelineFinished = this.childAnimation.finished.then(() => this.allAnimationCompleted());
                }
                else
                    this.props.onComplete(this.props.index)
            }
        });

        if (this.props.shouldBeVisible) {
            this.animeRef.restart()
        }
    }

    componentWillReceiveProps(nextProps) {

        if (this.props.play === true && !nextProps.play) {
            if (this.childAnimation) {
                this.childAnimation.pause()
            }
        }
        else if (!this.props.play === true && nextProps.play && nextProps.shouldBeVisible) {
            if (this.childAnimation) {
                this.childAnimation.play()
            }
        }

        if (!nextProps.shouldBeVisible && this.props.shouldBeVisible) {
            //Component is being hidden. Rewind animation.
            if (this.sequentialHighlight)
                this.sequentialHighlight.clear();
            this.animeRef.seek(0);
            if (this.childAnimation) {
                this.childAnimation.seek(0);
                this.childAnimation = this.component.current.getAnimation()
            }
        }
        if (nextProps.shouldBeVisible && !this.props.shouldBeVisible) {
            //Start Animation.
            this.animeRef.restart();
            //Highlight code to show user, which part of the code is being represented by this animation.
            this.sequentialHighlight = this.highlightCode();

        }
    }

    highlightCode = (isHover = false) => {
        let line = this.component.current.props.line;
        if (line) {
            const lineLength = this.props.cm.editor.getLine(line).length;
            return this.props.cm.editor.doc.markText({line, ch: 0}, {line, ch: lineLength}, {
                className: isHover ? 'highlighted-code' : 'sequential-highlighted-code'
            });
        }
        return null
    };

    onEnter = () => {
        this.hoverHighlight = this.highlightCode(true);
        let c = this.component.current;
        if (c && c.timeline) {
            this.isLoop = c.timeline.loop;
            c.timeline.loop = true;
            c.timeline.restart();
        }
    }

    onLeave = () => {
        if (this.hoverHighlight) this.hoverHighlight.clear();
        let c = this.component.current;
        if (c && c.timeline) {
            c.timeline.loop = this.isLoop;
            c.timeline.restart();
            c.timeline.seek(Infinity);
        }
    }

    render() {
        return (
            <Container
                ref={this.container}
                onMouseEnter={this.onEnter}
                onMouseLeave={this.onLeave}
            >
                {React.cloneElement(this.props.component, {ref: this.component})}
            </Container>
        );
    }
}
