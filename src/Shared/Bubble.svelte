<script>
  export let alt
  export let main
  export let sub
</script>

<div class="bubble">
  <span><img src="/cuppSass.png" alt={alt} /></span>
  <span class="main">{main}</span>
  <span>{sub}</span>
</div>

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

  .bubble span {
    display: block;
  }

  .main {
    margin-top: 20px;
    font-weight: 800;
  }
</style>