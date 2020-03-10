<script>
  export let summary
</script>

{#if summary.roles < 1 || summary.hours < 1}
  <span class="paragraph">
    Välj vilka roller som ska ingå i teamet och börja allokera dessa i veckovyn.
  </span>
{:else}
  <span class="paragraph">
    Valt team består av <span class="highlight">{summary.roles}</span> roller som lägger <span class="highlight">{summary.hours}</span> timmar i veckan.
  </span>
  <span class="paragraph">
    Förväntad månadskostnad är <span class="highlight">{summary.rate}</span> kr i veckan.
  </span>
{/if}

<style>
  span.highlight {
    background-color: rgba(71, 253, 164, 0.7);
    padding: 0px 4px;
  }
  
  span.paragraph {
    display: block;
  }
</style>