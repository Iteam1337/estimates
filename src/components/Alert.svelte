<script>
  export let heading
  export let text
</script>

<style>
  .fixed {
    background-color: #ffcffa;
    bottom: 0px;
    height: 200px;
    width: 100%;
    z-index: 2;
    border-radius: 10px;
    align-content: center;
    margin-top: 20px;
    padding-top: 10px;
  }

  .fixed h2 {
    margin-bottom: 2px;
  }

  .fixed p {
    margin-top: 2px;
  }
</style>

<div class="fixed">
  <h2>{heading}</h2>
  <p>{text}</p>
</div>
