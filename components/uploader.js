import React from 'react'
import PropTypes from 'prop-types'
import {useDropzone} from 'react-dropzone'
import {Pane, Spinner, Paragraph} from 'evergreen-ui'

function Uploader({file, maxSize, placeholder, onDrop, onDropRejected, height, disabled, loading, loadingLabel, ...props}) {
  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    maxSize,
    onDrop,
    onDropRejected,
    disabled,
    multiple: false
  })

  if (loading) {
    return (
      <Pane
        border
        height={150}
        background='gray100'
        display='flex'
        alignItems='center'
        justifyContent='center'
        flexDirection='column'
      >
        <Spinner size={32} />
        <Paragraph marginTop={8}>Analyse en cours</Paragraph>
      </Pane>
    )
  }

  return (
    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
      <Pane
        border
        height={height}
        background='gray100'
        display='flex'
        alignItems='center'
        justifyContent='center'
        textAlign='center'
        cursor='pointer'
        wordWrap='break-word'
        elevation={isDragActive ? 0 : null}
        {...props}
      >
        <input {...getInputProps()} />
        <Paragraph color={file ? 'default' : 'muted'}>
          {file ? file.name : placeholder}
        </Paragraph>
      </Pane>
    </div>
  )
}

Uploader.propTypes = {
  file: PropTypes.object,
  maxSize: PropTypes.number,
  placeholder: PropTypes.string.isRequired,
  onDrop: PropTypes.func.isRequired,
  onDropRejected: PropTypes.func.isRequired,
  height: PropTypes.number,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  loadingLabel: PropTypes.string
}

Uploader.defaultProps = {
  file: null,
  maxSize: null,
  height: 100,
  loading: false,
  disabled: false,
  loadingLabel: 'Chargement…'
}

export default Uploader
