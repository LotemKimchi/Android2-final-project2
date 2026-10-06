import { createRoot } from 'react-dom/client';
import { DoodleCanvas } from './DoodleCanvas.jsx';
import { VideoPlayer } from './VideoPlayer.jsx';

/** Mounts a React tree into a DOM element owned by jQuery code; returns an unmount function. */
function mount(element, reactElement) {
  const root = createRoot(element);
  root.render(reactElement);
  return () => root.unmount();
}

export function mountVideoPlayer(element, { src }) {
  return mount(element, <VideoPlayer src={src} />);
}

export function mountDoodleCanvas(element, { onChange }) {
  return mount(element, <DoodleCanvas onChange={onChange} />);
}
