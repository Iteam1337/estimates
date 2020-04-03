<style>
  #hero {
    position: absolute;
    width: 100%;
    height: 50%;
    left: 0;
    top: -20px;

    background: url('/hero-mobile.png');
    background-repeat: no-repeat;
    mix-blend-mode: normal;
    opacity: 0.8;
    border-radius: 28px;

    z-index: 0;
  }

  @media (min-width: 640px) {
    #hero {
      margin: 0 auto;
      height: 500px;
      top: -20px;

      background: url('/hero.png');
      background-repeat: no-repeat;
      background-size: cover;
      mix-blend-mode: normal;
      opacity: 0.8;
      border-radius: 28px;

      z-index: 0;
    }
  }
</style>

<div id="hero" />
