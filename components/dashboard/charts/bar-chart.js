import React from 'react'
import PropTypes from 'prop-types'
import {Heading} from 'evergreen-ui'
import {Bar} from 'react-chartjs-2'

const BarChart = ({title, data}) => {
  const options = {
    tooltips: {
      mode: 'index'
    },
    scales: {
      xAxes: [
        {
          type: 'time',
          time: {
            unit: 'month'
          },
          stacked: true,
          gridLines: {
            offsetGridLines: true
          },
          offset: true
        }
      ],
      yAxes: [
        {
          stacked: true
        }
      ]
    }
  }

  return (
    <div>
      {title && (
        <Heading marginBottom={16} textAlign='center'>
          {title}
        </Heading>
      )}
      <Bar data={data} options={options} />
    </div>
  )
}

BarChart.propTypes = {
  title: PropTypes.string,
  data: PropTypes.object.isRequired
}

BarChart.defaultProps = {
  title: null
}

export default BarChart
