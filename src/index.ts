
import { SingletonServer } from "@app/server/server"


const init = (): void => {
    SingletonServer.getInstance().start();
}

init();