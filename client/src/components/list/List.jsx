import "./list.scss"
import Card from "../../components/card/Card"

function List({ posts, showActions = false, onEdit, onDelete, deletingId = "" }) {
    return(
        <div className="list">
            {posts.map(item=>(
                <Card
                    key={item.id}
                    item={item}
                    showActions={showActions}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isDeleting={deletingId === item.id}
                />
            ))}
        </div>
    )
}

export default List