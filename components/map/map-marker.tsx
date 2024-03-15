import React from "react";
import { Marker } from "react-map-gl";
import { MapMarkerIcon, Pane, Text } from "evergreen-ui";
import { Marker as MarkerType } from "contexts/markers";

interface MapMarkerProps {
  size?: number;
  marker: MarkerType;
}

function MapMarker({ size = 32, marker }: MapMarkerProps) {
  const { label, color } = marker;
  return (
    <Marker
      {...marker}
      style={marker.onClick ? { cursor: "pointer" } : {}}
      offsetLeft={-size / 2 + (size / 100) * 15} // Calculates the difference of width between the SVG size and its container
      offsetTop={-size + 1}
    >
      <Pane>
        <Text
          position="absolute"
          top={-30}
          transform={`translate(calc(-50% + ${size / 2}px), -5px)`} // Place label on top of marker
          borderRadius={20}
          backgroundColor="rgba(0, 0, 0, 0.7)"
          color="white"
          paddingX={8}
          paddingY={1}
          fontSize={10}
          whiteSpace="nowrap"
        >
          {label}
        </Text>

        <MapMarkerIcon
          filter="drop-shadow(1px 2px 1px rgba(0, 0, 0, .3))"
          color={color}
          size={size}
        />
      </Pane>
    </Marker>
  );
}

export default React.memo(MapMarker);
