import * as styles from '../style.css';
import { TEST_DATA } from '../test.const';
function Button(props: {
  children: any;
}) {
  return <button>{props.children}</button>;
}
import { test } from "inline.tsx";
import { Route } from "inline.tsx";
Route.addChildren([]);
const component = () => {
  return <div className="p-2">
        {test}
        <h3 className={styles.indexPageTitle}>{TEST_DATA.welcome}</h3>
        <Button>Click me</Button>
      </div>;
};
export { component };