import { Pane, Button } from "evergreen-ui";

import usePublishProcess from "@/hooks/publish-process";

import StatusBadge from "@/components/status-badge";
import BANSync from "@/components/sub-header/bal-status/ban-sync";
import RefreshSyncBadge from "@/components/sub-header/bal-status/refresh-sync-badge";
import { CommuneType } from "@/types/commune";
import {
  BasesLocalesService,
  ExtendedBaseLocaleDTO,
  Sync,
} from "@/lib/openapi";

interface BALStatusProps {
  baseLocale: ExtendedBaseLocaleDTO;
  commune: CommuneType;
  token: string;
  isHabilitationValid: boolean;
  isRefrehSyncStat: boolean;
  handlePublication: () => Promise<any>;
  handleHabilitation: () => Promise<void>;
  reloadBaseLocale: () => void;
}

function BALStatus({
  baseLocale,
  commune,
  token = null,
  isHabilitationValid,
  isRefrehSyncStat,
  handlePublication,
  handleHabilitation,
  reloadBaseLocale,
}: BALStatusProps) {
  const { handleShowHabilitationProcess } = usePublishProcess(commune);

  const handlePause = async () => {
    await BasesLocalesService.pauseBaseLocale();
    await reloadBaseLocale();
  };

  const handleResumeSync = async () => {
    await BasesLocalesService.resumeBaseLocale();
    await reloadBaseLocale();
  };

  return (
    <>
      <Pane height={28} marginRight={8} flexShrink={0}>
        {isRefrehSyncStat ? (
          <RefreshSyncBadge />
        ) : (
          <StatusBadge
            status={baseLocale.status}
            sync={baseLocale.sync}
            isHabilitationValid={isHabilitationValid}
          />
        )}
      </Pane>

      {token &&
        (baseLocale.sync && isHabilitationValid ? (
          <BANSync
            baseLocale={baseLocale}
            commune={commune}
            handleSync={handlePublication}
            togglePause={
              baseLocale.sync.isPaused ? handleResumeSync : handlePause
            }
            isHabilitationValid={isHabilitationValid}
          />
        ) : (
          <>
            {(baseLocale.status === ExtendedBaseLocaleDTO.status.PUBLISHED ||
              baseLocale.status === ExtendedBaseLocaleDTO.status.REPLACED) &&
              baseLocale.sync?.status !== Sync.status.SYNCED &&
              !isHabilitationValid && (
                <Button
                  marginRight={8}
                  height={24}
                  appearance="primary"
                  onClick={handleShowHabilitationProcess}
                >
                  Habiliter la BAL
                </Button>
              )}
            {baseLocale.status === ExtendedBaseLocaleDTO.status.DRAFT && (
              <Button
                marginRight={8}
                height={24}
                appearance="primary"
                onClick={handleHabilitation}
              >
                Publier
              </Button>
            )}
          </>
        ))}
    </>
  );
}

export default BALStatus;
