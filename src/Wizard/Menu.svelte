<style>
  div.menu {
    background-color: var(--midnight-sand);
    bottom: 0;
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: flex-end;
    align-content: stretch;
    color: var(--sproud);
  }

  a,
  a:visited {
    color: var(--sproud);
    text-decoration: none;
    padding: 1em;
  }

  a:hover {
    background-color: var(--sproud);
    color: var(--midnight-sand);
  }

  ul {
    font-size: 1em;
    padding-left: 1em;
  }

  li {
    display: inline;
    text-align: center;
  }

  @media (max-width: 640px) {
    ul {
      margin-left: auto;
      margin-right: auto;
    }
  }
</style>

<div class="menu">
  <ul>
    <li>
      <a href="/">Team</a>
    </li>
    <li>
      <a href="/week">Vecka</a>
    </li>
    <li>
      <a href="/plan">Planering</a>
    </li>
  </ul>
</div>
