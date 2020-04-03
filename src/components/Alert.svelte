<script>
  export let heading
  export let text
</script>

<style>
  .fixed {
    background-color: #ffcffa;
    bottom: 0px;
    height: 200px;
    width: 80%;
    z-index: 2;
    border-radius: 10px;
    align-content: center;
    margin: 20px 7%;
    padding: 10px;
  }

  .fixed h2 {
    margin-bottom: 2px;
  }

  .fixed p {
    margin-top: 2px;
    padding: 0 15px;
  }
</style>

<div class="fixed">
  <h2>{heading}</h2>
  <p>{text}</p>
</div>
