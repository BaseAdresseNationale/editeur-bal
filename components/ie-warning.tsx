function IEWarning() {
  return (
    <div className="ie-warning">
      <p>
        Votre navigateur <b>Internet Explorer</b> n‘est plus supporté par notre
        service.
      </p>
      <p>
        <b>Nous vous recommandons d‘utiliser un autre navigateur</b>
      </p>

      <style jsx>{`
        .ie-warning {
          display: none;
          padding: 10px;
          background-color: #f00;
          color: #fff;
          text-align: center;
        }

        @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
          /* IE10+ CSS */
          .ie-warning {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}

export default IEWarning;
