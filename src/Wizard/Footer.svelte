<style>
  div.footer {
    position: absolute;
    bottom: 0;
    width: 100%;
    border-top: 1px black solid;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: flex-end;
    align-content: stretch;
  }

  div.area-link {
    height: 4em;
    border-right: 1px black solid;
    text-align: center;
  }

  @media (max-width: 640px) {
    div.area-link:last-child {
      border-right: 0;
    }

    div.area-link {
      width: 25%;
    }
  }

  @media (min-width: 640px) {
    div.area-link > p {
      margin: 2em;
    }
  }
</style>

<div class="footer">
  <div class="area-link">
    <p>
      <a href="/">Översikt</a>
    </p>
  </div>
  <div class="area-link">
    <p>
      <a href="/team">Team</a>
    </p>
  </div>
  <div class="area-link">
    <p>
      <a href="/week">Vecka</a>
    </p>
  </div>
  <div class="area-link">
    <p>
      <a href="/plan">Planering</a>
    </p>
  </div>
</div>
