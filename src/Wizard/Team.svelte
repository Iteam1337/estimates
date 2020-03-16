<script>
  import Bubble from '../Shared/Bubble.svelte'
</script>

<style>
  div.bubbles {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-around;
    align-items: stretch;
    align-content: stretch;
  }
</style>

<div>
  <div class="bubbles">
    <Bubble alt={''} main={'0 kr'} sub={'per månad'} />
    <Bubble alt={''} main={'1337'} sub={'Teamtaxa'} />
  </div>

  <div>
    <h1>Välj ditt drömteam</h1>
  </div>
</div>