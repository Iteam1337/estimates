<script>
  export let alt
  export let main
  export let sub
  export let mobileOnly
</script>

<style>
  .bubble {
    margin-top: 65%;
    width: 40%;
    background-color: #ffffff;
    z-index: 1;
    border-bottom-left-radius: 28px;
    border-top-right-radius: 28px;
    text-align: center;
    padding: 20px 0;

    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05);
  }

  img {
    margin: 20px 0;
  }

  .bubble span {
    display: block;
  }

  .main {
    margin-top: 20px;
    font-weight: 800;
  }

  @media (min-width: 640px) {
    .bubble {
      margin-top: 400px;
      width: 150px;
    }

    .mobileOnly {
      display: none;
    }
  }
</style>

<div class="bubble {mobileOnly ? 'mobileOnly' : ''}">
  <span>
    <img src="/cuppSass.png" {alt} />
  </span>
  <span class="main">{main}</span>
  <span>{sub}</span>
</div>
