import {useContext, useEffect} from 'react'
import PropTypes from 'prop-types'
import {Pane, Button, Badge, Alert, TrashIcon, ControlIcon, Text} from 'evergreen-ui'

import ParcellesContext from '@/contexts/parcelles'
import MapContext from '@/contexts/map'

import InputLabel from '@/components/input-label'

function SelectParcelles({initialParcelles, isToponyme}) {
  const {isCadastreDisplayed, setIsCadastreDisplayed} = useContext(MapContext)
  const {selectedParcelles, setSelectedParcelles, setIsParcelleSelectionEnabled, hoveredParcelle, handleHoveredParcelle, handleParcelle} = useContext(ParcellesContext)
  const addressType = isToponyme ? 'toponyme' : 'numéro'

  useEffect(() => {
    setSelectedParcelles(initialParcelles)
    setIsParcelleSelectionEnabled(true)

    return () => {
      setIsParcelleSelectionEnabled(false)
    }
  }, [initialParcelles, setSelectedParcelles, setIsParcelleSelectionEnabled])

  return (
    <Pane display='flex' flexDirection='column'>
      <InputLabel
        title='Parcelles cadastre'
        help={`Depuis la carte, cliquez sur les parcelles que vous souhaitez ajouter au ${addressType}. En précisant les parcelles associées à cette adresse, vous accélérez sa réutilisation par de nombreux services, DDFiP, opérateurs de courrier, de fibre et de GPS.`}
      />
      <Pane>
        {selectedParcelles.length > 0 ?
          selectedParcelles.map(parcelle => {
            const isHovered = parcelle === hoveredParcelle?.id

            return (
              <Badge
                key={parcelle}
                isInteractive
                color={parcelle === hoveredParcelle?.id ? 'red' : 'green'}
                margin={4}
                onClick={() => handleParcelle(parcelle)}
                onMouseEnter={() => handleHoveredParcelle({id: parcelle})}
                onMouseLeave={() => handleHoveredParcelle(null)}
              >
                {parcelle}{isHovered && <TrashIcon marginLeft={4} size={14} color='danger' verticalAlign='text-bottom' />}
              </Badge>
            )
          }) : (
            <Alert marginTop={8}>
              <Text>
                Depuis la carte, cliquez sur les parcelles que vous souhaitez ajouter au {addressType}.
              </Text>
            </Alert>
          )}
      </Pane>

      <Button
        type='button'
        display='flex'
        justifyContent='center'
        marginTop={8}
        iconAfter={ControlIcon}
        onClick={() => setIsCadastreDisplayed(!isCadastreDisplayed)}
      >
        {isCadastreDisplayed ? 'Masquer' : 'Afficher'} le cadastre
      </Button>
    </Pane>
  )
}

SelectParcelles.defaultProps = {
  initialParcelles: [],
  isToponyme: false
}

SelectParcelles.propTypes = {
  initialParcelles: PropTypes.array,
  isToponyme: PropTypes.bool,
}

export default SelectParcelles
