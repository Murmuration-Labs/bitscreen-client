import { Router, Request, Response } from 'express';
import * as db from "../db";
const databaseName = "complaints";

const usersRouter = Router();

usersRouter.get("/complaints", (req: Request, res: Response) => {
    db.findAll(databaseName, "complaints")
        .then((data) => res.send(data))
        .catch((err) => res.send({ error: err }));
    });

usersRouter.get("/complaints/:_id", (req: Request, res: Response) => {
    db.findById(databaseName, "complaints", parseInt(req.params._id))
        .then((data) => {
        if(data){
            res.send(data)
        }
        else{
            res.status(404).send();
        }
        })
        .catch((err) => res.send({ error: err }));
});

usersRouter.post("/complaints", (req: Request, res: Response) => {
    db.insert(databaseName, "complaints", req.body)
        .then((data) =>
        res.send({
            success: true,
            _id: data,
        })
        )
        .catch((err) =>
        res.send({
            success: false,
            error: err,
        })
        );
});

usersRouter.put("/complaints", (req: Request, res: Response) => {
    db.update(databaseName, "complaints", req.body)
        .then((data) =>
        res.send({
            success: true,
            _id: data,
        })
        )
        .catch((err) => {
        console.log(err);
        res.send({
            success: false,
        });
        });
});

usersRouter.delete("/complaints/:id", (req: Request, res: Response) => {
    db.remove(databaseName, "complaints", parseInt(req.params.id))
        .then(() => {
        res.send({
            success: true,
        });
        })
        .catch((err) => {
        console.log(err);
        res.send({
            success: false,
        });
        });
});

export default usersRouter;