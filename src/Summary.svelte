<script>
  export let summary
</script>

{#if summary.roles > 0 && summary.hours > 0}
  <p>
    Valt team består av <span class="highlight">{summary.roles}</span> roller som tillsammans lägger <span class="highlight">{summary.hours}</span> timmar i veckan.
  </p>
  <p>
    Förväntad månadskostnad är <span class="highlight">{summary.rate}</span> kr i veckan.
  </p>
{/if}

<style>
  span.highlight {
    background-color: rgba(71, 253, 164, 0.7);
    padding: 0px 4px;
  }
</style>