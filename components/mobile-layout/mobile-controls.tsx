import { Button, ListIcon, MapIcon, Pane } from "evergreen-ui";

interface MobileControlsProps {
  onToggle: (showMap: boolean) => void;
  isHidden: boolean;
  isDemo: boolean;
}

export function MobileControls({
  onToggle,
  isHidden,
  isDemo,
}: MobileControlsProps) {
  return (
    <Pane
      position="absolute"
      width="100%"
      height={50}
      bottom={isDemo ? 50 : 0}
      display="flex"
      justifyContent="space-around"
      background="white"
      zIndex={2}
    >
      <Button
        isActive={!isHidden}
        onClick={() => onToggle(false)}
        height="100%"
        flexGrow={1}
        border="none"
      >
        <ListIcon />
      </Button>
      <Button
        isActive={isHidden}
        onClick={() => onToggle(true)}
        height="100%"
        flexGrow={1}
        border="none"
      >
        <MapIcon />
      </Button>
    </Pane>
  );
}
