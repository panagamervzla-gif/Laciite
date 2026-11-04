const PAN_KEY_STEP = 40;
const PAN_KEY_SHIFT_STEP = 120;

export function bindImagePanControls(stage: HTMLElement) {
  let pointerId: number | undefined;
  let dragStartX = 0;
  let dragStartY = 0;
  let scrollStartLeft = 0;
  let scrollStartTop = 0;

  function refresh(): void {
    const canPan = stage.scrollWidth > stage.clientWidth || stage.scrollHeight > stage.clientHeight;
    stage.classList.toggle('is-pannable', canPan);
    if (!canPan && pointerId !== undefined) finishDrag();
  }

  function finishDrag(): void {
    const activePointer = pointerId;
    pointerId = undefined;
    stage.classList.remove('is-panning');
    if (activePointer !== undefined && stage.hasPointerCapture?.(activePointer)) {
      stage.releasePointerCapture(activePointer);
    }
  }

  stage.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    refresh();
    if (!stage.classList.contains('is-pannable')) return;

    pointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    scrollStartLeft = stage.scrollLeft;
    scrollStartTop = stage.scrollTop;
    stage.classList.add('is-panning');
    stage.focus();
    event.preventDefault();
    stage.setPointerCapture?.(event.pointerId);
  });

  stage.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId) return;
    stage.scrollLeft = Math.max(0, Math.min(
      stage.scrollWidth - stage.clientWidth,
      scrollStartLeft - (event.clientX - dragStartX)
    ));
    stage.scrollTop = Math.max(0, Math.min(
      stage.scrollHeight - stage.clientHeight,
      scrollStartTop - (event.clientY - dragStartY)
    ));
    event.preventDefault();
  });

  stage.addEventListener('pointerup', event => {
    if (event.pointerId === pointerId) finishDrag();
  });
  stage.addEventListener('pointercancel', event => {
    if (event.pointerId === pointerId) finishDrag();
  });
  stage.addEventListener('lostpointercapture', event => {
    if (event.pointerId === pointerId) finishDrag();
  });

  stage.addEventListener('keydown', event => {
    const maxLeft = stage.scrollWidth - stage.clientWidth;
    const maxTop = stage.scrollHeight - stage.clientHeight;
    const step = event.shiftKey ? PAN_KEY_SHIFT_STEP : PAN_KEY_STEP;
    let nextLeft = stage.scrollLeft;
    let nextTop = stage.scrollTop;

    if (event.key === 'ArrowLeft' && maxLeft > 0) nextLeft -= step;
    else if (event.key === 'ArrowRight' && maxLeft > 0) nextLeft += step;
    else if (event.key === 'ArrowUp' && maxTop > 0) nextTop -= step;
    else if (event.key === 'ArrowDown' && maxTop > 0) nextTop += step;
    else return;

    event.preventDefault();
    stage.scrollLeft = Math.max(0, Math.min(maxLeft, nextLeft));
    stage.scrollTop = Math.max(0, Math.min(maxTop, nextTop));
  });

  refresh();
  return { refresh };
}
