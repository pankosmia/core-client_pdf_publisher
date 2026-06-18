import { useEffect, useRef, useState } from "react";

export default function ArrowLeft({ children, show = false }) {
  const contentRef = useRef(null);
  const [arrowCoords, setArrowCoords] = useState(null);
  const tipOffset = 10;
  useEffect(() => {
    if (!contentRef.current) return;

    function measure() {
      const container = contentRef.current;
      const items = container.children;
      if (items.length < 2) {
        setArrowCoords(null);
        return;
      }

      const containerTop = container.getBoundingClientRect().top;
      const first = items[0].getBoundingClientRect();
      const last = items[items.length - 1].getBoundingClientRect();

      setArrowCoords({
        h: container.getBoundingClientRect().height,
        y0: last.top + last.height / 1.2 - containerTop, // center of last item
        y1: first.top + first.height / 3.5 - containerTop, // center of first item
      });
    }

    const ro = new ResizeObserver(measure);
    ro.observe(contentRef.current);
    measure();
    return () => ro.disconnect();
  }, [children]);

  function renderSvg({ h, y0, y1 }) {
    const xL = 17; // left rail x (from original)
    const xR = 39; // right rail x (from original)
    const xMid = (xL + xR) / 2; // 28
    const capH = 12; // how tall the U-bend arc is
    const arrowH = 15; // arrowhead height (tip to base)
    const aw = 8; // arrowhead half-width

    // Top U-bend center y: just above y1
    const topBendY = y1 - capH;
    // Bottom U-bend center y: just below y0
    const botBendY = y0 + capH;

    return (
      <svg
        width="49"
        height={h}
        viewBox={`0 0 49 ${h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", height: "100%" }}
      >
        {/* Left rail: from base of top arrowhead down to base of bottom arrowhead */}
        <line
          x1={xL}
          y1={y1 + arrowH + 10}
          x2={xL}
          y2={y0 - arrowH}
          stroke="black"
          strokeOpacity="0.2"
          strokeWidth="4"
        />

        {/* Right rail: between the two U-bends */}
        <line
          x1={xR}
          y1={topBendY + capH}
          x2={xR}
          y2={botBendY - capH}
          stroke="black"
          strokeOpacity="0.2"
          strokeWidth="4"
        />

        {/* Top U-bend — opens downward, connects left-rail top to right-rail top */}
        <path
          d={`M ${xL} ${y1 + arrowH - 20} L ${xL} ${topBendY + capH} Q ${xL} ${topBendY} ${xMid} ${topBendY} Q ${xR} ${topBendY} ${xR} ${topBendY + capH}`}
          stroke="black"
          strokeOpacity="0.2"
          strokeWidth="4"
          fill="none"
        />

        {/* Bottom U-bend — opens upward, connects left-rail bottom to right-rail bottom */}
        <path
          d={`M ${xL} ${y0 - arrowH} L ${xL} ${botBendY - capH} Q ${xL} ${botBendY} ${xMid} ${botBendY} Q ${xR} ${botBendY} ${xR} ${botBendY - capH}`}
          stroke="black"
          strokeOpacity="0.2"
          strokeWidth="4"
          fill="none"
        />

        {/* Top arrowhead — pointing UP, tip at y1 */}
        <polygon
          points={`${xL},${y1 + tipOffset} 
           ${xL - aw},${y1 + arrowH + tipOffset} 
           ${xL + aw},${y1 + arrowH + tipOffset}`}
          fill="black"
          fillOpacity="0.2"
        />
      </svg>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          minWidth: 36,
          position: "relative",
          alignSelf: "stretch",
        }}
      >
        {show && arrowCoords && (
          <div
            style={{
              position: "absolute",
              inset: 0,
            }}
          >
            {renderSvg({
              ...arrowCoords,
              h: contentRef.current?.offsetHeight ?? arrowCoords.h,
            })}
          </div>
        )}
      </div>

      <div ref={contentRef} style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
