import { useState, useCallback, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import Router from "next/router";
import { Dialog, Pane, Text, Spinner, toaster } from "evergreen-ui";

const EDITEUR_URL =
  process.env.NEXT_PUBLIC_EDITEUR_URL || "https://mes-adresses.data.gouv.fr";

import { ApiDepotService } from "@/lib/api-depot";
import {
  sendAuthenticationCode,
  validateAuthenticationCode,
} from "@/lib/bal-api";

import BalDataContext from "@/contexts/bal-data";

import ValidateAuthentication from "@/components/habilitation-process/validate-authentication";
import StrategySelection from "@/components/habilitation-process/strategy-selection";
import AcceptedDialog from "@/components/habilitation-process/accepted-dialog";
import RejectedDialog from "@/components/habilitation-process/rejected-dialog";
import usePublishProcess from "@/hooks/publish-process";

function getStep(habilitation) {
  if (habilitation.status !== "pending") {
    return 2;
  }

  if (habilitation.strategy?.type === "email") {
    return 1;
  }

  return 0;
}

function HabilitationProcess({
  token,
  baseLocale,
  commune,
  habilitation,
  handlePublication,
  resetHabilitationProcess,
  handleClose,
}) {
  const [step, setStep] = useState(getStep(habilitation));
  const [isLoading, setIsLoading] = useState(false);
  const [isConflicted, setIsConflicted] = useState(false);
  const [isLoadingPublish, setIsLoadingPublish] = useState(false);
  const { handleChangeStatus } = usePublishProcess(commune);

  const { reloadHabilitation } = useContext(BalDataContext);

  const sendCode = async () => {
    return sendAuthenticationCode(token, baseLocale, habilitation.emailCommune);
  };

  const redirectToFranceConnect = () => {
    const redirectUrl = encodeURIComponent(
      `${EDITEUR_URL}${Router.asPath}?france-connect=1`
    );
    Router.push(
      `${habilitation.franceconnectAuthenticationUrl}?redirectUrl=${redirectUrl}`
    );
  };

  const handleStrategy = async (selectedStrategy) => {
    setIsLoading(true);
    if (selectedStrategy === "email") {
      try {
        await sendCode();
        setStep(1);
      } catch (error) {
        toaster.danger("Le courriel n’a pas pu être envoyé", {
          description: error.message,
        });
      }
    }

    if (
      selectedStrategy === "france-connect" &&
      habilitation.franceconnectAuthenticationUrl
    ) {
      redirectToFranceConnect();
    }

    setIsLoading(false);
  };

  // Checks revisions to warn of a conflict
  const checkConflictingRevision = useCallback(async () => {
    try {
      const revisions = await ApiDepotService.getRevisions(commune.code);
      setIsConflicted(revisions.length > 0);
    } catch (error) {
      console.log(
        "Impossible de récupérer les révisions pour cette commune. Error :",
        error
      );
    }
  }, [commune.code]);

  const handleValidationCode = async (code) => {
    setIsLoading(true);
    const { status, validated, remainingAttempts } =
      await validateAuthenticationCode(token, baseLocale._id, code);

    if (!remainingAttempts) {
      // Habilitation rejected
      if (validated === "false") {
        handleClose();
      }

      // Habilitation accepted
      if (status === "accepted") {
        checkConflictingRevision();
        setStep(2);
      }

      await reloadHabilitation();
    }

    setIsLoading(false);
  };

  // Restart habilitation process, create new habilitation
  const handleReset = () => {
    setStep(0);
    resetHabilitationProcess();
  };

  const handleConfirm = async () => {
    setIsLoadingPublish(true);
    if (habilitation.status === "accepted") {
      await handlePublication();
    }

    setIsLoadingPublish(false);
    handleClose();
  };

  // We want to change the BAL status from draft to ready-to-publish
  // only if the habilitation is accepted
  useEffect(() => {
    if (baseLocale.status === "draft" && habilitation.status === "accepted") {
      handleChangeStatus("ready-to-publish");
    }
  }, [handleChangeStatus, baseLocale, habilitation]);

  useEffect(() => {
    const step = getStep(habilitation);
    if (step === 2) {
      if (baseLocale.sync) {
        // Skip publication step when renewing accreditation
        handleClose();
      } else {
        checkConflictingRevision();
      }
    }

    setStep(step);
  }, [baseLocale, habilitation, checkConflictingRevision, handleClose]);

  return (
    <Dialog
      isShown
      width={1200}
      preventBodyScrolling
      hasHeader={false}
      intent={isConflicted ? "danger" : "success"}
      hasFooter={step === 2}
      hasCancel={step === 2 && habilitation.status === "accepted"}
      confirmLabel={
        habilitation.status === "accepted"
          ? isConflicted
            ? "Forcer la publication"
            : "Publier"
          : "Fermer"
      }
      cancelLabel="Attendre"
      onConfirm={handleConfirm}
      isConfirmDisabled={isLoadingPublish}
      onCloseComplete={handleClose}
    >
      <Pane>
        {step === 0 && (
          <StrategySelection
            franceconnectAuthenticationUrl={
              habilitation.franceconnectAuthenticationUrl
            }
            emailCommune={habilitation.emailCommune}
            handleStrategy={handleStrategy}
          />
        )}

        {step === 1 && (
          <ValidateAuthentication
            emailCommune={habilitation.emailCommune}
            validatePinCode={handleValidationCode}
            resendCode={sendCode}
            onCancel={handleReset}
          />
        )}

        {step === 2 && habilitation.status === "accepted" && (
          <AcceptedDialog
            {...habilitation}
            baseLocaleId={baseLocale._id}
            commune={commune}
            isConflicted={isConflicted}
          />
        )}

        {step === 2 && habilitation.status === "rejected" && (
          <RejectedDialog
            communeName={commune.nom}
            strategyType={habilitation.strategy.type}
          />
        )}
      </Pane>

      {isLoading && (
        <Pane
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Spinner size={42} />
          <Text fontStyle="italic">Chargement…</Text>
        </Pane>
      )}
    </Dialog>
  );
}

HabilitationProcess.propTypes = {
  token: PropTypes.string.isRequired,
  baseLocale: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    sync: PropTypes.object,
    status: PropTypes.oneOf([
      "replaced",
      "published",
      "ready-to-publish",
      "draft",
    ]).isRequired,
  }).isRequired,
  commune: PropTypes.shape({
    code: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired,
  }).isRequired,
  habilitation: PropTypes.shape({
    status: PropTypes.string.isRequired,
    emailCommune: PropTypes.string,
    franceconnectAuthenticationUrl: PropTypes.string.isRequired,
    strategy: PropTypes.shape({
      type: PropTypes.oneOf(["email", "franceconnect"]),
    }),
  }).isRequired,
  handlePublication: PropTypes.func.isRequired,
  resetHabilitationProcess: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default HabilitationProcess;
