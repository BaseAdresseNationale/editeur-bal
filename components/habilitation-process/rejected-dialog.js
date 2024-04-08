import PropTypes from "prop-types";
import { Alert, Text } from "evergreen-ui";

function RejectedDialog({ communeName, strategyType }) {
  return (
    <Alert intent="danger" title="Votre demande d’habilitation a été rejetée">
      <Text>
        {strategyType === "email" &&
          "Vous avez dépassé le nombre maximum de tentatives autorisé."}

        {strategyType === "franceconnect" &&
          `Vous n’avez pas été identifié comme un élu de la commune de ${communeName}.`}
      </Text>
    </Alert>
  );
}

RejectedDialog.propTypes = {
  communeName: PropTypes.string,
  strategyType: PropTypes.oneOf(["email", "franceconnect", "internal"]),
};

export default RejectedDialog;
