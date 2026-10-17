"use client";

// Catches anything that breaks the live scene: a render error anywhere in
// it (including the three chunk failing to load) or the WebGL context
// being lost. Either way the page falls back: html[data-mode]="fallback"
// (the scrolling layout, the static /piazza.png in #stage, the Collection
// below) and the scene is unmounted for good. onFallback lets the parent
// drop everything that only made sense over a live scene.

import { Component, createRef, type ReactNode } from "react";

type SceneBoundaryProps = {
  onFallback?: () => void;
  children: ReactNode;
};

export class SceneBoundary extends Component<SceneBoundaryProps, { failed: boolean }> {
  state = { failed: false };
  private wrap = createRef<HTMLDivElement>();
  // The element listened on, kept so unmount removes exactly that listener.
  private listening: HTMLDivElement | null = null;
  private mounted = false;

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("piazza: scene failed, showing the static painting", error);
    this.fallBack();
  }

  // webglcontextlost doesn't bubble, so it's caught on the way down: a
  // capturing listener on this wrapper sees it for any canvas inside.
  // An unmounting scene (a mode change) loses its context on purpose as
  // R3F disposes it, after this boundary is gone: that isn't a failure.
  private onContextLost = () => {
    if (!this.mounted || this.state.failed) return;
    console.error("piazza: WebGL context lost, showing the static painting");
    this.setState({ failed: true });
    this.fallBack();
  };

  private fallBack() {
    document.documentElement.dataset.mode = "fallback";
    this.props.onFallback?.();
  }

  componentDidMount() {
    this.mounted = true;
    this.listening = this.wrap.current;
    this.listening?.addEventListener("webglcontextlost", this.onContextLost, true);
  }

  componentWillUnmount() {
    this.mounted = false;
    this.listening?.removeEventListener("webglcontextlost", this.onContextLost, true);
    this.listening = null;
  }

  render() {
    if (this.state.failed) return null;
    return (
      <div ref={this.wrap} style={{ display: "contents" }}>
        {this.props.children}
      </div>
    );
  }
}
